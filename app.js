function getTheme() {
    return localStorage.getItem('portfolio-theme-v2') || 'light';
}

function setTheme(theme) {
    const html = document.documentElement;
    html.setAttribute('data-theme', theme);

    const themeIcon = document.getElementById('theme-icon');
    if (themeIcon) {
        themeIcon.textContent = theme === 'dark' ? '☀️' : '🌙';
    }
}

function toggleTheme() {
    const currentTheme = document.documentElement.getAttribute('data-theme') || getTheme();
    const nextTheme = currentTheme === 'dark' ? 'light' : 'dark';
    localStorage.setItem('portfolio-theme-v2', nextTheme);
    setTheme(nextTheme);
}

function escapeHtml(value) {
    return String(value)
        .replaceAll('&', '&amp;')
        .replaceAll('<', '&lt;')
        .replaceAll('>', '&gt;')
        .replaceAll('"', '&quot;')
        .replaceAll("'", '&#39;');
}

async function fetchJson(path) {
    const response = await fetch(path);
    if (!response.ok) {
        throw new Error(`Could not load ${path}`);
    }
    return response.json();
}

function renderNews(newsData) {
    const newsSection = document.getElementById('news');
    if (!newsSection) return;

    const newsContainer = newsSection.querySelector('div:not(h2)') || document.createElement('div');
    newsContainer.innerHTML = '';

    newsData.forEach(item => {
        const newsItem = document.createElement('div');
        newsItem.className = 'news-item';
        newsItem.innerHTML = `<span class="news-date">${escapeHtml(item.date)}:</span> ${item.content}`;
        newsContainer.appendChild(newsItem);
    });

    if (!newsSection.contains(newsContainer)) {
        newsSection.appendChild(newsContainer);
    }
}

function renderPublications(journalsData, conferencesData) {
    const pubSection = document.getElementById('publications');
    if (!pubSection) return;

    const h3s = pubSection.querySelectorAll('h3');
    const journalsH3 = h3s[0];
    const conferencesH3 = h3s[1];

    let nextElement = journalsH3.nextElementSibling;
    while (nextElement && nextElement.tagName !== 'H3') {
        nextElement.remove();
        nextElement = journalsH3.nextElementSibling;
    }

    nextElement = conferencesH3.nextElementSibling;
    while (nextElement && nextElement.tagName !== 'H3' && nextElement.tagName !== 'FOOTER') {
        nextElement.remove();
        nextElement = conferencesH3.nextElementSibling;
    }

    journalsData.forEach(pub => {
        const pubItem = document.createElement('div');
        pubItem.className = 'pub-item';
        pubItem.innerHTML = `
            <strong>${escapeHtml(pub.label)}</strong> ${escapeHtml(pub.authors)}.
            <a href="${pub.link}" target="_blank" rel="noopener noreferrer">"${escapeHtml(pub.title)}"</a>
            <i>${escapeHtml(pub.venue)}</i>${pub.volume ? ` ${escapeHtml(pub.volume)}` : ''}${pub.issue ? `, ${escapeHtml(pub.issue)}` : ''}${pub.year ? ` (${escapeHtml(pub.year)})` : ''}.${pub.doi ? ` DOI: ${escapeHtml(pub.doi)}` : ''}
        `;
        journalsH3.parentElement.insertBefore(pubItem, journalsH3.nextElementSibling);
    });

    const sortedConferences = [...conferencesData].sort((a, b) => (b.year || 0) - (a.year || 0));

    let lastInsertedElement = conferencesH3;
    sortedConferences.forEach(pub => {
        const pubItem = document.createElement('div');
        pubItem.className = 'pub-item';
        pubItem.innerHTML = `
            <strong>${escapeHtml(pub.label)}</strong> ${escapeHtml(pub.authors)}.
            <a href="${pub.link}" target="_blank" rel="noopener noreferrer">"${escapeHtml(pub.title)}"</a>
            In <i>${escapeHtml(pub.venue)}</i>${pub.pages ? `, ${escapeHtml(pub.pages)}` : ''}${pub.year ? `, ${escapeHtml(pub.year)}` : ''}.${pub.doi ? ` DOI: ${escapeHtml(pub.doi)}` : ''}
        `;
        lastInsertedElement.parentElement.insertBefore(pubItem, lastInsertedElement.nextElementSibling);
        lastInsertedElement = pubItem;
    });
}

function renderTeaching(teachingData, thesisData) {
    const teachingSection = document.getElementById('teaching');
    if (!teachingSection) return;

    const table = teachingSection.querySelector('.teaching-table');
    if (table) {
        table.innerHTML = '';
        teachingData.forEach(item => {
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${escapeHtml(item.semester)}</td>
                <td>${escapeHtml(item.course)}</td>
            `;
            table.appendChild(row);
        });
    }

    const ongoingList = document.createElement('ol');
    ongoingList.className = 'thesis-list';
    (thesisData.ongoing || []).forEach(thesis => {
        const li = document.createElement('li');
        li.className = 'thesis-item';
        let html = `${escapeHtml(thesis.title)} <span class="thesis-type">(${escapeHtml(thesis.type)}`;
        if (thesis.cooperation) {
            html += ` - in cooperation with ${escapeHtml(thesis.cooperation)}`;
        }
        html += `)</span>`;
        li.innerHTML = html;
        ongoingList.appendChild(li);
    });

    const completedList = document.createElement('ol');
    completedList.className = 'thesis-list';
    (thesisData.completed || []).forEach(thesis => {
        const li = document.createElement('li');
        li.className = 'thesis-item';
        let html = '';
        if (thesis.year) {
            html += `(${escapeHtml(thesis.year)}) `;
        }
        html += `${escapeHtml(thesis.title)} <span class="thesis-type">(${escapeHtml(thesis.type)}`;
        if (thesis.cooperation) {
            html += ` - in cooperation with ${escapeHtml(thesis.cooperation)}`;
        }
        if (thesis.note) {
            html += ` ${escapeHtml(thesis.note)}`;
        }
        html += `)</span>`;
        li.innerHTML = html;
        completedList.appendChild(li);
    });

    teachingSection.querySelectorAll('.thesis-list, .thesis-group').forEach(node => node.remove());

    const ongoingP = document.createElement('p');
    ongoingP.className = 'thesis-group';
    ongoingP.textContent = 'Ongoing / Assigned';

    const completedP = document.createElement('p');
    completedP.className = 'thesis-group';
    completedP.textContent = 'Completed';

    teachingSection.appendChild(ongoingP);
    teachingSection.appendChild(ongoingList);
    teachingSection.appendChild(completedP);
    teachingSection.appendChild(completedList);
}

function renderPresentations(presData) {
    const presSection = document.getElementById('presentations');
    if (!presSection) return;

    let container = presSection.querySelector('[data-presentations-container]');
    if (!container) {
        container = document.createElement('div');
        container.setAttribute('data-presentations-container', 'true');
        presSection.appendChild(container);
    }

    container.innerHTML = '';

    presData.forEach(pres => {
        const presItem = document.createElement('div');
        presItem.className = 'pres-item';
        presItem.innerHTML = `
            <div class="pres-title">${escapeHtml(pres.title)}</div>
            <div class="pres-details">${escapeHtml(pres.venue)}, ${escapeHtml(pres.date)}</div>
            ${pres.recordingLink ? `<a href="${pres.recordingLink}" class="watch-link" target="_blank" rel="noopener noreferrer">[Watch Recording]</a>` : ''}
        `;
        container.appendChild(presItem);
    });
}

async function loadBlogs() {
    const blogList = document.getElementById('blog-list');
    if (!blogList) return;

    try {
        const blogs = await fetchJson('blog/manifest.json');

        if (blogs.length === 0) {
            blogList.innerHTML = '<p style="color: var(--secondary-text); font-style: italic;">No blog posts available yet.</p>';
            return;
        }

        blogs.sort((a, b) => new Date(b.date) - new Date(a.date));
        blogList.innerHTML = '';

        blogs.forEach(blog => {
            const blogItem = document.createElement('div');
            blogItem.className = 'blog-item';
            blogItem.innerHTML = `
                <div class="blog-title"><a href="blog/${escapeHtml(blog.filename)}">${escapeHtml(blog.title)}</a></div>
                <div class="blog-meta">${escapeHtml(blog.date)} • ${escapeHtml(blog.readTime)}</div>
                <p class="blog-excerpt">${escapeHtml(blog.excerpt)}</p>
            `;
            blogList.appendChild(blogItem);
        });
    } catch (error) {
        console.error('Error loading blogs:', error);
        blogList.innerHTML = '<p style="color: var(--secondary-text); font-style: italic;">Unable to load blog posts at this time.</p>';
    }
}

async function loadContentData() {
    try {
        const [newsData, journalsData, conferencesData, teachingData, thesisData, presData] = await Promise.all([
            fetchJson('data/news.json'),
            fetchJson('data/publications-journals.json'),
            fetchJson('data/publications-conferences.json'),
            fetchJson('data/teaching.json'),
            fetchJson('data/thesis.json'),
            fetchJson('data/presentations.json')
        ]);

        renderNews(newsData);
        renderPublications(journalsData, conferencesData);
        renderTeaching(teachingData, thesisData);
        renderPresentations(presData);
    } catch (error) {
        console.error('Error loading content:', error);
    }
}

document.addEventListener('DOMContentLoaded', () => {
    setTheme(getTheme());
    loadContentData();
    loadBlogs();
});
