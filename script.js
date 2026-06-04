(function () {
  const navToggle = document.querySelector(".nav-toggle");
  const navLinks = document.querySelector("#nav-links");
  const toTop = document.querySelector("[data-to-top]");

  if (navToggle && navLinks) {
    navToggle.addEventListener("click", () => {
      const isOpen = navLinks.classList.toggle("is-open");
      navToggle.setAttribute("aria-expanded", String(isOpen));
    });

    navLinks.addEventListener("click", (event) => {
      if (!event.target.closest("a")) return;
      navLinks.classList.remove("is-open");
      navToggle.setAttribute("aria-expanded", "false");
    });
  }

  if (toTop) {
    window.addEventListener("scroll", () => {
      toTop.classList.toggle("is-visible", window.scrollY > 700);
    });
    toTop.addEventListener("click", () => window.scrollTo({ top: 0, behavior: "smooth" }));
  }

  const form = document.querySelector("[data-md-form]");
  const output = document.querySelector("[data-md-output]");
  if (!form || !output) return;

  const formKind = form.dataset.formKind || "custom";
  const formLabel = form.dataset.formLabel || "PLFC AI form";
  const filePrefix = form.dataset.filePrefix || "plfc-ai-form";
  const aiInstruction = form.dataset.aiInstruction || "Use plain Australian English. Keep it short, clear and useful.";
  const storageKey = `plfc-ai-helper-forms:${formKind}`;
  const status = document.querySelector("[data-builder-status]");
  const copyButton = document.querySelector("[data-copy-md]");
  const downloadButton = document.querySelector("[data-download-md]");
  const clearButton = document.querySelector("[data-clear-md]");

  function today() {
    return new Date().toISOString().slice(0, 10);
  }

  function clean(value) {
    return String(value || "").trim();
  }

  function paragraph(value, fallback) {
    return clean(value) || fallback;
  }

  function list(value) {
    const items = clean(value)
      .split(/\r?\n/)
      .map((line) => line.trim())
      .filter(Boolean);

    if (!items.length) return "- Add links, file names, notes or clues here.";
    return items.map((item) => `- ${item}`).join("\n");
  }

  function yaml(value) {
    const text = clean(value);
    if (!text) return '""';
    if (/^[A-Za-z0-9_.:/@-]+$/.test(text)) return text;
    return JSON.stringify(text);
  }

  function slugify(value) {
    return clean(value)
      .toLowerCase()
      .replace(/&/g, "and")
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "") || filePrefix;
  }

  function readForm() {
    return Object.fromEntries(new FormData(form).entries());
  }

  function filenameFor(data) {
    const title = clean(data.title);
    return `${title ? slugify(title) : filePrefix}.md`;
  }

  function buildMarkdown(data) {
    const title = paragraph(data.title, formLabel);
    const created = today();

    return [
      "---",
      "schema: plfc_simple_ai_form.v1",
      `form: ${yaml(formKind)}`,
      `title: ${yaml(title)}`,
      `created: ${yaml(created)}`,
      `file_name: ${yaml(filenameFor(data))}`,
      "source_site: plfc-ai-agent-md-forms",
      "---",
      "",
      `# ${title}`,
      "",
      "## What I Need",
      paragraph(data.need, "Say the job in one or two plain sentences."),
      "",
      "## Source Notes Or Links",
      list(data.sources),
      "",
      "## Please Make",
      paragraph(data.make, "Say what you want the AI to make."),
      "",
      "## Extra Notes",
      paragraph(data.notes, "No extra notes."),
      "",
      "## Simple AI Instruction",
      aiInstruction,
      "",
      "If something important is missing, ask me a clear question before making the final version.",
      ""
    ].join("\n");
  }

  function setStatus(message) {
    if (!status) return;
    status.textContent = message;
    window.clearTimeout(setStatus.timer);
    setStatus.timer = window.setTimeout(() => {
      status.textContent = "Ready.";
    }, 2200);
  }

  function save() {
    const data = readForm();
    localStorage.setItem(storageKey, JSON.stringify(data));
    output.value = buildMarkdown(data);
  }

  function hydrate() {
    let data = {};
    try {
      data = JSON.parse(localStorage.getItem(storageKey) || "{}");
    } catch (error) {
      data = {};
    }

    Object.entries(data).forEach(([name, value]) => {
      const field = form.elements[name];
      if (field) field.value = value;
    });

    output.value = buildMarkdown(readForm());
  }

  function downloadText(filename, text) {
    const blob = new Blob([text], { type: "text/markdown;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
  }

  form.addEventListener("input", save);
  form.addEventListener("submit", (event) => {
    event.preventDefault();
    save();
    setStatus("Markdown updated.");
  });

  if (copyButton) {
    copyButton.addEventListener("click", async () => {
      save();
      try {
        await navigator.clipboard.writeText(output.value);
      } catch (error) {
        output.removeAttribute("readonly");
        output.select();
        document.execCommand("copy");
        output.setSelectionRange(0, 0);
        output.blur();
        output.setAttribute("readonly", "readonly");
      }
      setStatus("Markdown copied.");
    });
  }

  if (downloadButton) {
    downloadButton.addEventListener("click", () => {
      const data = readForm();
      save();
      downloadText(filenameFor(data), output.value);
      setStatus(`${filenameFor(data)} is ready.`);
    });
  }

  if (clearButton) {
    clearButton.addEventListener("click", () => {
      localStorage.removeItem(storageKey);
      form.reset();
      output.value = buildMarkdown(readForm());
      setStatus("Answers cleared.");
    });
  }

  hydrate();
})();
