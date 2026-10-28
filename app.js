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
    const response = await fetch(path, { cache: 'no-store' });
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
        newsItem.innerHTML = `<span class="news-date">${escapeHtml(item.date)}:</span><div class="news-content">${item.content}</div>`;
        newsContainer.appendChild(newsItem);
    });

    if (!newsSection.contains(newsContainer)) {
        newsSection.appendChild(newsContainer);
    }
}


const publicationIcons = {
    pdf: '<path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><path d="M14 2v6h6M12 11v7m-3-3 3 3 3-3"/>',
    cite: '<path d="M9 6H4v7h5v-3H6V8h3zm11 0h-5v7h5v-3h-3V8h3zM4 17h16"/>',
    dataset: '<ellipse cx="12" cy="5" rx="8" ry="3"/><path d="M4 5v14c0 4 16 4 16 0V5M4 12c0 4 16 4 16 0"/>'
};

function publicationIcon(name) {
    return `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${publicationIcons[name]}</svg>`;
}

function publicationUrl(value) {
    try {
        const url = new URL(value);
        return ['https:', 'http:'].includes(url.protocol) ? url.href : null;
    } catch { return null; }
}

function appendPublicationActions(container, pub) {
    const actions = document.createElement('div');
    actions.className = 'publication-actions';
    const addLink = (label, icon, url) => {
        const link = document.createElement('a');
        link.className = 'publication-action';
        link.href = url;
        link.target = '_blank';
        link.rel = 'noopener noreferrer';
        link.setAttribute('aria-label', `${label} for ${pub.title} (opens in a new tab)`);
        link.innerHTML = `${publicationIcon(icon)}<span>${label}</span>`;
        actions.appendChild(link);
    };
    const pdf = publicationUrl(pub.pdf);
    if (pdf) addLink('PDF', 'pdf', pdf);
    else {
        const unavailable = document.createElement('span');
        unavailable.className = 'publication-action unavailable';
        unavailable.innerHTML = `${publicationIcon('pdf')}<span>PDF unavailable</span>`;
        actions.appendChild(unavailable);
    }
    if (pub.bibtex) {
        const cite = document.createElement('button');
        cite.type = 'button';
        cite.className = 'publication-action';
        cite.innerHTML = `${publicationIcon('cite')}<span>Cite</span>`;
        cite.setAttribute('aria-label', `Cite ${pub.title}`);
        cite.setAttribute('aria-haspopup', 'dialog');
        cite.addEventListener('click', () => {
            document.getElementById('citation-title').textContent = pub.title;
            document.getElementById('citation-bibtex').value = pub.bibtex;
            document.getElementById('citation-status').textContent = '';
            document.getElementById('citation-dialog').showModal();
        });
        actions.appendChild(cite);
    }
    const dataset = publicationUrl(pub.dataset);
    if (dataset) addLink('Dataset', 'dataset', dataset);
    container.appendChild(actions);
}

function setupCitationDialog() {
    const dialog = document.getElementById('citation-dialog');
    if (!dialog) return;
    dialog.querySelector('.citation-close').addEventListener('click', () => dialog.close());
    document.getElementById('copy-citation').addEventListener('click', async () => {
        const text = document.getElementById('citation-bibtex');
        const status = document.getElementById('citation-status');
        try {
            await navigator.clipboard.writeText(text.value);
            status.textContent = 'Copied!';
        } catch {
            text.focus();
            text.select();
            status.textContent = 'Copy was blocked. The BibTeX is selected; press Ctrl+C or ⌘C to copy.';
        }
    });
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
        const rawLabel = pub.label || '';
        const cleanLabel = rawLabel.replace(/^\[|\]$/g, '');
        pubItem.innerHTML = `
            <span class="pub-venue-badge">${escapeHtml(cleanLabel)}</span> ${escapeHtml(pub.authors)}.
            <a href="${pub.link}" target="_blank" rel="noopener noreferrer">"${escapeHtml(pub.title)}"</a>
            <i>${escapeHtml(pub.venue)}</i>${pub.volume ? ` ${escapeHtml(pub.volume)}` : ''}${pub.issue ? `, ${escapeHtml(pub.issue)}` : ''}${pub.year ? ` (${escapeHtml(pub.year)})` : ''}.${pub.doi ? ` DOI: ${escapeHtml(pub.doi)}` : ''}
        `;
        appendPublicationActions(pubItem, pub);
        journalsH3.parentElement.insertBefore(pubItem, journalsH3.nextElementSibling);
    });

    const sortedConferences = [...conferencesData].sort((a, b) => (b.year || 0) - (a.year || 0));

    let lastInsertedElement = conferencesH3;
    sortedConferences.forEach(pub => {
        const pubItem = document.createElement('div');
        pubItem.className = 'pub-item';
        const rawLabel = pub.label || '';
        const cleanLabel = rawLabel.replace(/^\[|\]$/g, '');
        pubItem.innerHTML = `
            <span class="pub-venue-badge">${escapeHtml(cleanLabel)}</span> ${escapeHtml(pub.authors)}.
            <a href="${pub.link}" target="_blank" rel="noopener noreferrer">"${escapeHtml(pub.title)}"</a>
            In <i>${escapeHtml(pub.venue)}</i>${pub.pages ? `, ${escapeHtml(pub.pages)}` : ''}${pub.year ? `, ${escapeHtml(pub.year)}` : ''}.${pub.doi ? ` DOI: ${escapeHtml(pub.doi)}` : ''}
        `;
        appendPublicationActions(pubItem, pub);
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
        html += escapeHtml(thesis.title);
        if (thesis.type) {
            html += ` <span class="thesis-type">(${escapeHtml(thesis.type)}`;
            if (thesis.cooperation) {
                html += ` - in cooperation with ${escapeHtml(thesis.cooperation)}`;
            }
            if (thesis.note) {
                html += ` ${escapeHtml(thesis.note)}`;
            }
            html += `)</span>`;
        }
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

function renderService(serviceData) {
    const serviceSection = document.getElementById('service');
    if (!serviceSection) return;

    const serviceList = serviceSection.querySelector('#service-list') || document.createElement('div');
    serviceList.innerHTML = '';

    serviceData.forEach(group => {
        const groupBlock = document.createElement('div');
        groupBlock.style.marginBottom = '1.5rem';

        const heading = document.createElement('h3');
        heading.textContent = group.category;
        groupBlock.appendChild(heading);

        const list = document.createElement('ul');
        list.style.paddingLeft = '1.2rem';
        list.style.marginBottom = '0';

        (group.items || []).forEach(item => {
            const li = document.createElement('li');
            li.style.marginBottom = '0.75rem';
            const parts = [];
            if (item.year) {
                parts.push(`(${escapeHtml(item.year)})`);
            }
            if (item.event) {
                parts.push(escapeHtml(item.event));
            }
            if (item.role) {
                parts.push(escapeHtml(item.role));
            }
            if (item.note) {
                parts.push(escapeHtml(item.note));
            }
            if (item.link) {
                li.innerHTML = `${parts.join(', ')}. <a href="${item.link}" target="_blank" rel="noopener noreferrer">Link</a>`;
            } else {
                li.innerHTML = `${parts.join(', ')}.`;
            }
            list.appendChild(li);
        });

        groupBlock.appendChild(list);
        serviceList.appendChild(groupBlock);
    });

    if (!serviceSection.contains(serviceList)) {
        serviceSection.appendChild(serviceList);
    }
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
    const hasHomepageSections = document.getElementById('news')
        || document.getElementById('publications')
        || document.getElementById('teaching')
        || document.getElementById('presentations')
        || document.getElementById('service');

    if (!hasHomepageSections) {
        return;
    }

    try {
        const [newsData, journalsData, conferencesData, teachingData, thesisData, presData, serviceData] = await Promise.all([
            fetchJson('data/news.json'),
            fetchJson('data/publications-journals.json'),
            fetchJson('data/publications-conferences.json'),
            fetchJson('data/teaching.json'),
            fetchJson('data/thesis.json'),
            fetchJson('data/presentations.json'),
            fetchJson('data/service.json')
        ]);

        renderNews(newsData);
        renderPublications(journalsData, conferencesData);
        renderTeaching(teachingData, thesisData);
        renderPresentations(presData);
        renderService(serviceData);
    } catch (error) {
        console.error('Error loading content:', error);
    }
}

document.addEventListener('DOMContentLoaded', () => {
    setTheme(getTheme());
    setupCitationDialog();
    loadContentData();
    loadBlogs();
});
