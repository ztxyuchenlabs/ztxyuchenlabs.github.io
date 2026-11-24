(() => {
    const root = document.documentElement;
    const theme = document.getElementById("theme");
    const menu = document.getElementById("menu");
    const links = document.getElementById("links");
    function setTheme(value) {
        root.dataset.theme = value;
        try { localStorage.setItem("theme", value); } catch (error) {}
        if (theme) {
            theme.innerHTML = (value === "dark" ? "☼" : "◐") + " <small>Theme</small>";
            theme.setAttribute("aria-label", value === "dark" ? "Switch to light mode" : "Switch to dark mode");
        }
    }
    let savedTheme = root.dataset.theme || "light";
    try { savedTheme = localStorage.getItem("theme") || savedTheme; } catch (error) {}
    setTheme(savedTheme);
    if (theme) theme.addEventListener("click", () => setTheme(root.dataset.theme === "dark" ? "light" : "dark"));
    if (menu && links) menu.addEventListener("click", () => {
        const open = links.classList.toggle("open");
        menu.setAttribute("aria-expanded", String(open));
    });
    const year = document.getElementById("year");
    if (year) year.textContent = new Date().getFullYear();
    const content = document.getElementById("project-detail-content");
    const projectId = Number(content && content.dataset.projectId);
    const escapeHtml = value => String(value ?? "").replace(/[&<>"']/g, char => ({
        "&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"
    }[char]));
    const safeUrl = value => {
        if (typeof value !== "string" || !value.trim()) return null;
        try {
            const url = new URL(/^https?:\/\//i.test(value) ? value : "https://" + value);
            return ["https:","http:"].includes(url.protocol) ? url.href : null;
        } catch (error) { return null; }
    };
    const renderGroup = (label, values) => Array.isArray(values) && values.length
        ? '<section class="project-detail-section"><h2>' + label + '</h2><div class="tags">' +
          values.filter(v => typeof v === "string" && v.trim()).map(v => '<span>' + escapeHtml(v) + '</span>').join("") +
          '</div></section>' : "";
    async function load() {
        try {
            const response = await fetch("../../projects.json", {cache:"no-cache"});
            if (!response.ok) throw new Error("Unable to load projects.json");
            const data = await response.json();
            const project = Array.isArray(data.projects) ? data.projects.find(item => Number(item.id) === projectId) : null;
            if (!project) throw new Error("Project not found");
            document.title = project.title + " — ZtxYuchenLabs";
            const description = document.querySelector('meta[name="description"]');
            if (description) description.content = project.summary || project.title;
            const pictures = Array.isArray(project.pictures) ? project.pictures.map(safeUrl).filter(Boolean) : [];
            const gallery = pictures.length ? '<div class="project-detail-gallery">' + pictures.map((url,index) =>
                '<img src="' + escapeHtml(url) + '" alt="' + escapeHtml(project.title) + ' preview ' + (index+1) + '" loading="lazy">'
            ).join("") + '</div>' : "";
            const linkItems = [["githubLink","View source on GitHub ↗"],["docsLink","Read documentation ↗"],["youtubeLink","Watch videos ↗"]]
                .map(([key,label]) => safeUrl(project[key]) ? '<a href="' + escapeHtml(safeUrl(project[key])) + '" target="_blank" rel="noopener noreferrer">' + label + '</a>' : "")
                .join("");
            content.innerHTML =
                '<a class="project-back" href="../../projects.html">← Back to all projects</a>' +
                '<header class="project-detail-header"><p class="eyebrow">PROJECT DETAILS · ' + escapeHtml(project.license || "PROJECT") + '</p>' +
                '<h1>' + escapeHtml(project.title || "Untitled project") + '</h1><p class="project-detail-summary">' +
                escapeHtml(project.summary || "Project details coming soon.") + '</p></header>' + gallery +
                '<section class="project-detail-section"><h2>Project information</h2><div class="project-detail-meta">' +
                '<div><strong>PROJECT ID</strong><span>' + escapeHtml(project.id) + '</span></div>' +
                '<div><strong>LICENSE</strong><span>' + escapeHtml(project.license || "Not specified") + '</span></div></div></section>' +
                renderGroup("Frontend", project.frontend) + renderGroup("Backend", project.backend) +
                renderGroup("Database", project.database) +
                (linkItems ? '<section class="project-detail-section"><h2>Project links</h2><div class="project-detail-links">' + linkItems + '</div></section>' : "");
            content.setAttribute("aria-busy","false");
        } catch (error) {
            console.error(error);
            content.innerHTML = '<div class="project-detail-status"><h1>Project unavailable</h1><p>This project could not be loaded from projects.json.</p><a class="project-back" href="../../projects.html">← Back to all projects</a></div>';
            content.setAttribute("aria-busy","false");
        }
    }
    if (content) load();
})();