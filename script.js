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

  const form = document.querySelector("[data-ai-md-form]");
  const output = document.querySelector("[data-md-output]");
  if (!form || !output) return;

  const storageKey = "plfc-ai-helper-forms:builder";
  const status = document.querySelector("[data-builder-status]");
  const copyButton = document.querySelector("[data-copy-md]");
  const downloadButton = document.querySelector("[data-download-md]");
  const clearButton = document.querySelector("[data-clear-md]");

  const templates = {
    operations_meeting: {
      label: "Club operations",
      filename: "plfc-meeting-action-brief.md",
      notes: [
        "Create a short agenda, action list or meeting pack.",
        "Use assigned owners and dates.",
        "Keep draft minutes private until approved."
      ]
    },
    membership_volunteer: {
      label: "Membership and volunteers",
      filename: "plfc-membership-volunteer-brief.md",
      notes: [
        "Help people join, renew, volunteer or get shared access.",
        "Keep member contact details private.",
        "Make the next action simple and clear."
      ]
    },
    event_field: {
      label: "Fishing and events",
      filename: "plfc-event-field-ops-brief.md",
      notes: [
        "Plan competitions, check-ins, BBQs, field notes or wrap-ups.",
        "Use broad public locations unless exact location sharing is approved.",
        "Separate live safety notes from public stories."
      ]
    },
    social_content: {
      label: "Social content",
      filename: "plfc-social-content-brief.md",
      notes: [
        "Create captions, scripts, image prompts, video prompts or song prompts.",
        "Check permission before using names, faces, children or cultural material.",
        "Make one version for each platform only when needed."
      ]
    },
    source_storage: {
      label: "Source and storage",
      filename: "plfc-source-storage-map.md",
      notes: [
        "Map where source files live and who can access them.",
        "Keep private vault details out of public outputs.",
        "Record what can be exported publicly after review."
      ]
    },
    grants_evidence: {
      label: "Grants and evidence",
      filename: "plfc-grant-evidence-brief.md",
      notes: [
        "Turn events, attendance, photos and outcomes into grant-ready evidence.",
        "Use repeatable proof, not one-off claims.",
        "Record what still needs a human check."
      ]
    },
    education_tourism: {
      label: "Education and visitors",
      filename: "plfc-education-visitor-brief.md",
      notes: [
        "Make content friendly for kids, elders, visitors and English-as-second-language readers.",
        "Use plain Australian English.",
        "Check local facts and respectful wording before publishing."
      ]
    },
    custom: {
      label: "Custom AI helper",
      filename: "plfc-ai-helper-brief.md",
      notes: [
        "Be clear about what the AI should make.",
        "Separate facts from guesses.",
        "Ask a human to review before relying on the output."
      ]
    }
  };

  function today() {
    return new Date().toISOString().slice(0, 10);
  }

  function clean(value) {
    return String(value || "").trim();
  }

  function lines(value) {
    return clean(value)
      .split(/\r?\n/)
      .map((line) => line.trim())
      .filter(Boolean);
  }

  function paragraph(value, fallback) {
    return clean(value) || fallback || "Left open.";
  }

  function list(value, fallback) {
    const items = Array.isArray(value) ? value : lines(value);
    if (!items.length) return fallback || "- Left open.";
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
      .replace(/^-+|-+$/g, "") || "plfc-ai-helper-brief";
  }

  function readForm() {
    return Object.fromEntries(new FormData(form).entries());
  }

  function currentTemplate(data) {
    return templates[data.form_kind] || templates.custom;
  }

  function filenameFor(data) {
    const explicit = clean(data.filename);
    if (explicit) return explicit.endsWith(".md") ? explicit : `${explicit}.md`;
    const template = currentTemplate(data);
    if (clean(data.title)) return `${slugify(data.title)}.md`;
    return template.filename;
  }

  function buildMarkdown(data) {
    const template = currentTemplate(data);
    const title = paragraph(data.title, template.label);
    const created = today();

    return [
      "---",
      "schema: plfc_ai_helper_form.v1",
      `title: ${yaml(title)}`,
      `form_kind: ${yaml(data.form_kind || "custom")}`,
      `form_label: ${yaml(template.label)}`,
      `file_name: ${yaml(filenameFor(data))}`,
      `created: ${yaml(created)}`,
      `updated: ${yaml(created)}`,
      `ai_tool_or_model: ${yaml(data.ai_tool || "not_sure")}`,
      `output_wanted: ${yaml(data.output_type || "plain_summary")}`,
      `privacy_lane: ${yaml(data.privacy_lane || "committee_only")}`,
      `reviewer: ${yaml(data.reviewer || "committee_review_needed")}`,
      "source_site: plfc-ai-agent-md-forms",
      "---",
      "",
      `# ${title}`,
      "",
      "## Plain Goal",
      paragraph(data.plain_goal, "Explain what you want the AI to help with in one simple paragraph."),
      "",
      "## Who This Is For",
      paragraph(data.audience, "Point Lookout Fishing Club committee, members, volunteers, locals or visitors."),
      "",
      "## AI Tool Or Model",
      paragraph(data.ai_tool, "Not sure yet."),
      "",
      "## Output Wanted",
      paragraph(data.output_type, "Plain summary or checklist."),
      "",
      "## Source Files, Links Or Clues",
      list(data.source_files, "- Add source links, file names, Drive folders, photos, PDFs, spreadsheets or notes here."),
      "",
      "## Storage Location Or Source Of Truth",
      paragraph(data.storage_location, "Name where the source lives, such as club Drive, committee folder, website, email, calendar, local device or public page."),
      "",
      "## Context Notes",
      paragraph(data.context_notes, "Add useful background, timing, people, place, event, platform, audience or constraints."),
      "",
      "## Privacy And Permission Boundary",
      `Privacy lane: ${data.privacy_lane || "committee_only"}`,
      "",
      paragraph(data.must_not_share, "Do not share private member data, exact private GPS, payment details, private Drive paths or unapproved media."),
      "",
      "## Country, Culture And Community Care",
      paragraph(data.country_culture, "Use respectful wording. Ask, listen and get permission before sharing culture, people, images or stories."),
      "",
      "## Facts To Check Before Publishing",
      list(data.facts_to_check, "- Dates, times and locations.\n- Prices, benefits and official club wording.\n- Names, faces, permissions and source links."),
      "",
      "## Suggested AI Instructions",
      `You are helping Point Lookout Fishing Club. Use plain Australian English. The audience may include non-technical people, kids, elders, locals, multicultural visitors and people with English as a second language.`,
      "",
      `Task: ${paragraph(data.ai_request, "Create the requested output from the context and sources above.")}`,
      "",
      "Do not invent facts. If a fact is missing, write it as a question for a human to check.",
      "Keep private or permission-needed material out of public drafts.",
      "",
      "## Template Notes",
      list(template.notes),
      "",
      "## Review Notes",
      `Human reviewer: ${paragraph(data.reviewer, "Committee review needed.")}`,
      "",
      paragraph(data.review_notes, "Review for accuracy, permission, culture, privacy, tone and public safety."),
      "",
      "## Next Action",
      paragraph(data.next_action, "Choose one small next step and assign an owner."),
      "",
      "## Agent Safety Reminder",
      "- Treat this file as context, not proof.",
      "- Check current facts before relying on the output.",
      "- Do not publish private or sensitive information.",
      "- AI tools are helpers, not the boss.",
      ""
    ].join("\n");
  }

  function setStatus(message) {
    if (!status) return;
    status.textContent = message;
    window.clearTimeout(setStatus.timer);
    setStatus.timer = window.setTimeout(() => {
      status.textContent = "Ready.";
    }, 2600);
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
  form.addEventListener("change", save);
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
