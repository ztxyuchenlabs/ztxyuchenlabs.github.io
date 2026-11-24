(() => {
    const root = document.documentElement;
    const theme = document.getElementById("theme");
    const menu = document.getElementById("menu");
    const links = document.getElementById("links");
    const nav = [...document.querySelectorAll(".nav-link")];

    function setTheme(value) {
        root.dataset.theme = value;
        try { localStorage.setItem("theme", value); } catch (error) {}
        theme.innerHTML = (value === "dark" ? "☼" : "◐") + " <small>Theme</small>";
        theme.setAttribute("aria-label", value === "dark" ? "Switch to light mode" : "Switch to dark mode");
    }

    setTheme(root.dataset.theme || "light");
    theme.addEventListener("click", () => setTheme(root.dataset.theme === "dark" ? "light" : "dark"));
    menu.addEventListener("click", () => {
        const open = links.classList.toggle("open");
        menu.setAttribute("aria-expanded", String(open));
    });
    nav.forEach(link => link.addEventListener("click", () => {
        links.classList.remove("open");
        menu.setAttribute("aria-expanded", "false");
    }));

    const watch = new IntersectionObserver(entries => entries.forEach(entry => {
        if (entry.isIntersecting) {
            nav.forEach(link => link.classList.toggle("active", link.dataset.target === entry.target.id));
        }
    }), { rootMargin: "-35% 0px -55% 0px" });
    document.querySelectorAll(".section-watch").forEach(section => watch.observe(section));

    const reveal = new IntersectionObserver(entries => entries.forEach(entry => {
        if (entry.isIntersecting) {
            entry.target.classList.add("visible");
            reveal.unobserve(entry.target);
        }
    }), { threshold: 0.12 });
    document.querySelectorAll(".reveal").forEach(element => reveal.observe(element));

    document.getElementById("year").textContent = new Date().getFullYear();

    // Build project cards from the public projects.json file.
    const projectList = document.getElementById("project-list");

    function makeElement(tag, className, text) {
        const element = document.createElement(tag);
        if (className) element.className = className;
        if (text !== undefined) element.textContent = text;
        return element;
    }

    function safeExternalUrl(value) {
        if (typeof value !== "string" || !value.trim()) return null;
        const candidate = /^https?:\/\//i.test(value) ? value : "https://" + value;
        try {
            const url = new URL(candidate);
            return url.protocol === "https:" || url.protocol === "http:" ? url.href : null;
        } catch (error) {
            return null;
        }
    }

    function addTechnologyGroup(card, label, values) {
        if (!Array.isArray(values) || !values.length) return;
        const group = makeElement("div", "tech-group");
        group.append(makeElement("span", "tech-label", label));
        const tags = makeElement("div", "tags");
        values.forEach(value => {
            if (typeof value === "string" && value.trim()) tags.append(makeElement("span", "", value));
        });
        group.append(tags);
        card.append(group);
    }

    function createProjectCard(project, index) {
        const card = makeElement("article", "project project-card-link reveal");
        const projectSlug = String(project.title || "project").toLowerCase().trim()
            .replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "") || "project";
        const projectUrl = "./projects/" + projectSlug + "/project-page.html";
        card.tabIndex = 0;
        card.setAttribute("role", "link");
        card.setAttribute("aria-label", "View " + (project.title || "project") + " project details");
        card.addEventListener("click", event => {
            if (event.target.closest("a")) return;
            window.location.href = projectUrl;
        });
        card.addEventListener("keydown", event => {
            if ((event.key === "Enter" || event.key === " ") && !event.target.closest("a")) {
                event.preventDefault();
                window.location.href = projectUrl;
            }
        });
        const visual = makeElement("div", "project-image");
        const picture = Array.isArray(project.pictures) ? project.pictures.find(url => safeExternalUrl(url)) : null;

        if (picture) {
            const image = document.createElement("img");
            image.src = safeExternalUrl(picture);
            image.alt = project.title ? project.title + " project preview" : "Project preview";
            image.loading = "lazy";
            image.decoding = "async";
            visual.append(image);
        } else {
            visual.classList.add("project-image-placeholder");
            visual.append(makeElement("span", "", String(index + 1).padStart(2, "0")));
        }

        const body = makeElement("div", "project-body");
        body.append(makeElement("p", "project-license", project.license || "PROJECT"));
        body.append(makeElement("h3", "", project.title || "Untitled project"));
        body.append(makeElement("p", "project-summary", project.summary || "Project details coming soon."));

        addTechnologyGroup(body, "FRONTEND", project.frontend);
        addTechnologyGroup(body, "BACKEND", project.backend);
        addTechnologyGroup(body, "DATABASE", project.database);

        const actions = makeElement("div", "project-actions");
        [
            ["githubLink", "GitHub ↗"],
            ["docsLink", "Documentation ↗"],
            ["youtubeLink", "YouTube ↗"]
        ].forEach(([key, label]) => {
            const href = safeExternalUrl(project[key]);
            if (!href) return;
            const link = makeElement("a", "", label);
            link.href = href;
            link.target = "_blank";
            link.rel = "noopener noreferrer";
            actions.append(link);
        });
        if (actions.childElementCount) body.append(actions);

        card.append(visual, body);
        return card;
    }

    const searchForm = document.getElementById("project-search");
    const searchInput = document.getElementById("project-search-input");
    const searchClear = document.getElementById("project-search-clear");
    const searchCount = document.getElementById("project-search-count");
    let allProjects = [];

    function renderProjects(projects) {
        projectList.replaceChildren();
        if (!projects.length) {
            projectList.append(makeElement("p", "project-status", allProjects.length
                ? "No projects match your search. Try another title or technology."
                : "Projects will be added here soon."));
        } else {
            projects.forEach((project, index) => projectList.append(createProjectCard(project, allProjects.indexOf(project))));
            projectList.querySelectorAll(".reveal").forEach(element => reveal.observe(element));
        }
        if (searchCount) {
            searchCount.textContent = allProjects.length
                ? (projects.length === allProjects.length ? allProjects.length + " projects" : projects.length + " of " + allProjects.length + " projects")
                : "";
        }
    }

    function searchProjects(query) {
        const term = query.trim().toLocaleLowerCase();
        if (!term) {
            renderProjects(allProjects);
            return;
        }
        const matches = allProjects.filter(project => {
            const searchableFields = [
                project.title,
                ...(Array.isArray(project.frontend) ? project.frontend : []),
                ...(Array.isArray(project.backend) ? project.backend : []),
                ...(Array.isArray(project.database) ? project.database : [])
            ];
            return searchableFields.some(value => typeof value === "string" && value.toLocaleLowerCase().includes(term));
        });
        renderProjects(matches);
    }

    if (searchForm) {
        searchForm.addEventListener("submit", event => {
            event.preventDefault();
            searchProjects(searchInput.value);
        });
    }
    if (searchInput) {
        searchInput.addEventListener("input", () => searchProjects(searchInput.value));
    }
    if (searchClear) {
        searchClear.addEventListener("click", () => {
            searchInput.value = "";
            searchProjects("");
            searchInput.focus();
        });
    }

    async function loadProjects() {
        try {
            const response = await fetch("./projects.json", { cache: "no-cache" });
            if (!response.ok) throw new Error("Could not load projects.json (" + response.status + ")");
            const data = await response.json();
            if (!data || !Array.isArray(data.projects)) throw new Error("projects.json must contain a projects array.");
            allProjects = data.projects;
            renderProjects(allProjects);
        } catch (error) {
            console.error("Project loading failed:", error);
            projectList.replaceChildren(makeElement("p", "project-status", "Projects couldn't be loaded. Please try again later."));
            if (searchCount) searchCount.textContent = "";
        } finally {
            projectList.setAttribute("aria-busy", "false");
        }
    }

    if (projectList) loadProjects();
})();