(function () {
  "use strict";

  /* ==========================================================
     STUDIO DATA
     ========================================================== */
  var STUDIOS = {
    ai: {
      name: "AI & Digital Literacy Studio",
      icon: "🤖",
      color: "--studio-ai",
      colorBg: "--studio-ai-bg",
      summary: "A natural fit for curious builders who love figuring out how technology works.",
      description:
        "This child is drawn to computers, code, and now AI — they like taking things apart " +
        "(literally or digitally) to understand them, and they learn new tools fast, often without " +
        "being taught. This studio channels that curiosity into real technical skill and responsible, " +
        "creative use of technology.",
      skills: [
        "Coding fundamentals and computational thinking",
        "Responsible, hands-on use of AI tools",
        "Robotics and hardware basics",
        "Digital problem-solving and debugging mindset"
      ]
    },
    biz: {
      name: "Entrepreneurship Studio",
      icon: "💡",
      color: "--studio-biz",
      colorBg: "--studio-biz-bg",
      summary: "A natural fit for kids with big ideas and the drive to make them happen.",
      description:
        "This child likes starting things — a project, a club, a small business, a movement. They " +
        "think in opportunities, rally people around an idea, and aren't afraid of a little risk. This " +
        "studio gives that drive real structure: how to pitch, plan, budget, and follow through.",
      skills: [
        "Idea generation and opportunity spotting",
        "Pitching, persuasion, and communication",
        "Basic budgeting and financial literacy",
        "Leadership and resilience through setbacks"
      ]
    },
    creative: {
      name: "Creative Studio",
      icon: "🎨",
      color: "--studio-creative",
      colorBg: "--studio-creative-bg",
      summary: "A natural fit for imaginative expressers who create in whatever medium is at hand.",
      description:
        "This child processes the world through making — art, music, writing, design, performance. " +
        "They care about how something looks, sounds, or feels, and they're often the one who makes a " +
        "group project actually engaging. This studio builds technical craft around that instinct and " +
        "gives it an audience.",
      skills: [
        "Visual, written, or performing arts craft",
        "Design thinking and original expression",
        "Storytelling and communication",
        "Building and sharing a creative portfolio"
      ]
    },
    pm: {
      name: "Project Management Studio",
      icon: "📋",
      color: "--studio-pm",
      colorBg: "--studio-pm-bg",
      summary: "A natural fit for organizers who love turning chaos into a plan that works.",
      description:
        "This child is the one who makes the checklist, keeps a group on schedule, and actually finishes " +
        "what they start. They're reliable, detail-oriented, and good at getting other people coordinated. " +
        "This studio builds those instincts into real planning, leadership, and execution skills.",
      skills: [
        "Planning, scheduling, and prioritization",
        "Team coordination and delegation",
        "Time management and follow-through",
        "Leading a project from idea to completion"
      ]
    },
    innov: {
      name: "Innovation Studio",
      icon: "🔬",
      color: "--studio-innov",
      colorBg: "--studio-innov-bg",
      summary: "A natural fit for inventive problem-solvers who learn by experimenting.",
      description:
        "This child tinkers, experiments, and isn't afraid to fail their way to an answer. They notice " +
        "problems other people walk past and enjoy finding an unusual fix. This studio gives that instinct " +
        "a design-thinking process and real tools for invention.",
      skills: [
        "Design thinking and hands-on prototyping",
        "Scientific and experimental reasoning",
        "Creative problem-solving under constraints",
        "Resilience through iteration and failure"
      ]
    }
  };

  var STUDIO_ORDER = ["ai", "biz", "creative", "pm", "innov"];

  /* ==========================================================
     QUESTION BANK
     Each option maps to one studio key.
     ========================================================== */
  var QUESTIONS = [
    {
      text: "You get a free afternoon with nothing planned. What do you do?",
      options: [
        { key: "ai", label: "Mess around with an app, game, or gadget to figure out how it works" },
        { key: "biz", label: "Think of ways to earn money or start a small side project" },
        { key: "creative", label: "Draw, write, make music, or create something with your hands" },
        { key: "pm", label: "Organize your room, plan your week, or make a checklist" },
        { key: "innov", label: "Try to build, fix, or invent something from stuff lying around" }
      ]
    },
    {
      text: "Your friend group needs someone to plan a class event. What role do you take?",
      options: [
        { key: "pm", label: "The organizer — makes the timeline and keeps everyone on track" },
        { key: "biz", label: "The one who figures out budget or how to make it a bigger deal" },
        { key: "creative", label: "The one designing decorations, theme, or visuals" },
        { key: "innov", label: "The one solving problems when something doesn't go as planned" },
        { key: "ai", label: "The one setting up the tech — sign-ups, group chat, playlist, slides" }
      ]
    },
    {
      text: "Which subject or activity do you get most excited about?",
      options: [
        { key: "ai", label: "Computers, coding, robotics, or anything with technology" },
        { key: "biz", label: "Debate, current events, or how the world/economy works" },
        { key: "creative", label: "Art, music, drama, or creative writing" },
        { key: "pm", label: "Group projects where you get to plan and coordinate" },
        { key: "innov", label: "Science experiments and figuring out how things work" }
      ]
    },
    {
      text: "Your favorite kind of video to watch online is…",
      options: [
        { key: "ai", label: "Tech reviews, coding tutorials, or AI tools in action" },
        { key: "biz", label: "“How I built this,” entrepreneur stories, or business content" },
        { key: "creative", label: "Art tutorials, music, animation, or short films" },
        { key: "pm", label: "Productivity tips or “how to organize your life” videos" },
        { key: "innov", label: "Science experiments, inventions, or “how it's made” content" }
      ]
    },
    {
      text: "A group project at school is going wrong. What's your instinct?",
      options: [
        { key: "pm", label: "Step back and reorganize who's doing what and when" },
        { key: "innov", label: "Try a completely different approach nobody's tried yet" },
        { key: "biz", label: "Rally the group and get everyone committed to the goal" },
        { key: "creative", label: "Make it more fun so people actually want to finish it" },
        { key: "ai", label: "Look for an app or tool to make the work easier" }
      ]
    },
    {
      text: "You have $50 and a free weekend. What do you do with it?",
      options: [
        { key: "biz", label: "Turn it into more money — buy, sell, invest, or start something" },
        { key: "creative", label: "Buy supplies to make or design something" },
        { key: "ai", label: "Buy or try out a new tech tool or gadget" },
        { key: "innov", label: "Buy parts to build or invent something" },
        { key: "pm", label: "Plan exactly how to spend it to get the most value" }
      ]
    },
    {
      text: "People often come to you for…",
      options: [
        { key: "creative", label: "Ideas, designs, or making things look or sound good" },
        { key: "pm", label: "Getting organized or figuring out a plan" },
        { key: "biz", label: "Convincing others or figuring out how to make something happen" },
        { key: "ai", label: "Fixing tech problems or explaining how something works" },
        { key: "innov", label: "Solving a tricky problem in a new way" }
      ]
    },
    {
      text: "Which achievement would make you proudest?",
      options: [
        { key: "innov", label: "Inventing or building something that actually works" },
        { key: "biz", label: "Starting something — a club, shop, or channel — that grows" },
        { key: "creative", label: "Making something people say is beautiful, funny, or moving" },
        { key: "ai", label: "Building an app or game, or automating something with code" },
        { key: "pm", label: "Leading a team or event that runs smoothly start to finish" }
      ]
    },
    {
      text: "In a video game or board game, you're most likely to be the one who…",
      options: [
        { key: "pm", label: "Plans the strategy and keeps the team coordinated" },
        { key: "innov", label: "Finds the unexpected trick or workaround to win" },
        { key: "creative", label: "Cares about the story, characters, or how it all looks" },
        { key: "biz", label: "Trades, negotiates, or manages resources to get ahead" },
        { key: "ai", label: "Wants to know how the game was built, or wants to mod it" }
      ]
    },
    {
      text: "What kind of “future you” sounds most exciting?",
      options: [
        { key: "ai", label: "Building apps, robots, or working with cutting-edge tech" },
        { key: "biz", label: "Running your own company or brand" },
        { key: "creative", label: "Being a working artist, designer, filmmaker, or musician" },
        { key: "pm", label: "Leading big projects or teams that make things happen" },
        { key: "innov", label: "Inventing something that solves a real-world problem" }
      ]
    },
    {
      text: "When you don't know how to do something, you usually…",
      options: [
        { key: "ai", label: "Search online, watch a tutorial, or ask an AI tool" },
        { key: "innov", label: "Experiment and try different things until something works" },
        { key: "pm", label: "Break it into steps and make a plan to learn it" },
        { key: "biz", label: "Ask someone who already knows and learn from them directly" },
        { key: "creative", label: "Just start creating and figure it out as you go" }
      ]
    },
    {
      text: "What kind of compliment means the most to you?",
      options: [
        { key: "creative", label: "“That's so original” or “that's beautifully made”" },
        { key: "biz", label: "“You're a natural leader” or “you get things done”" },
        { key: "pm", label: "“You're so organized” or “you're so reliable”" },
        { key: "ai", label: "“You're really good with tech”" },
        { key: "innov", label: "“That's such a clever solution”" }
      ]
    }
  ];

  /* ==========================================================
     STATE
     ========================================================== */
  var state = {
    childName: "",
    childAge: null,
    respondent: "student",
    currentQuestion: 0,
    answers: new Array(QUESTIONS.length).fill(null) // stores studio key per question
  };

  /* ==========================================================
     DOM REFS
     ========================================================== */
  var screens = {
    intro: document.getElementById("screen-intro"),
    quiz: document.getElementById("screen-quiz"),
    results: document.getElementById("screen-results")
  };

  var introForm = document.getElementById("intro-form");
  var ageInput = document.getElementById("child-age");
  var ageError = document.getElementById("age-error");
  var parentNote = document.getElementById("parent-note");
  var respondentRadios = introForm.querySelectorAll('input[name="respondent"]');

  var progressFill = document.getElementById("quiz-progress-fill");
  var questionIndexEl = document.getElementById("question-index");
  var questionTotalEl = document.getElementById("question-total");
  var questionTextEl = document.getElementById("question-text");
  var optionsListEl = document.getElementById("options-list");
  var btnBack = document.getElementById("btn-back");
  var btnRestartMid = document.getElementById("btn-restart-mid");
  var btnRestartEnd = document.getElementById("btn-restart-end");
  var btnPrint = document.getElementById("btn-print");
  var btnEmail = document.getElementById("btn-email-results");

  questionTotalEl.textContent = String(QUESTIONS.length);

  /* ==========================================================
     NAVIGATION HELPERS
     ========================================================== */
  function showScreen(name) {
    Object.keys(screens).forEach(function (key) {
      screens[key].hidden = key !== name;
    });
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  /* ==========================================================
     INTRO SCREEN
     ========================================================== */
  respondentRadios.forEach(function (radio) {
    radio.addEventListener("change", function () {
      parentNote.hidden = radio.value !== "parent" || !radio.checked;
    });
  });

  introForm.addEventListener("submit", function (e) {
    e.preventDefault();
    var age = parseInt(ageInput.value, 10);
    var isValid = !isNaN(age) && age >= 10 && age <= 17;

    if (!isValid) {
      ageError.hidden = false;
      ageInput.setAttribute("aria-invalid", "true");
      ageInput.focus();
      return;
    }
    ageError.hidden = true;
    ageInput.removeAttribute("aria-invalid");

    state.childName = document.getElementById("child-name").value.trim();
    state.childAge = age;
    var checkedRespondent = introForm.querySelector('input[name="respondent"]:checked');
    state.respondent = checkedRespondent ? checkedRespondent.value : "student";
    state.currentQuestion = 0;
    state.answers = new Array(QUESTIONS.length).fill(null);

    renderQuestion();
    showScreen("quiz");
  });

  /* ==========================================================
     QUIZ SCREEN
     ========================================================== */
  function renderQuestion() {
    var qIndex = state.currentQuestion;
    var question = QUESTIONS[qIndex];

    questionIndexEl.textContent = String(qIndex + 1);
    progressFill.style.width = (((qIndex) / QUESTIONS.length) * 100) + "%";
    questionTextEl.textContent = question.text;

    optionsListEl.innerHTML = "";
    question.options.forEach(function (option, i) {
      var btn = document.createElement("button");
      btn.type = "button";
      btn.className = "option-btn";
      btn.setAttribute("role", "radio");
      btn.setAttribute("aria-checked", state.answers[qIndex] === option.key ? "true" : "false");
      if (state.answers[qIndex] === option.key) btn.classList.add("selected");
      btn.textContent = option.label;
      btn.addEventListener("click", function () {
        state.answers[qIndex] = option.key;
        goNext();
      });
      optionsListEl.appendChild(btn);
    });

    btnBack.disabled = qIndex === 0;
  }

  function goNext() {
    if (state.currentQuestion < QUESTIONS.length - 1) {
      state.currentQuestion += 1;
      renderQuestion();
    } else {
      progressFill.style.width = "100%";
      computeAndShowResults();
    }
  }

  btnBack.addEventListener("click", function () {
    if (state.currentQuestion > 0) {
      state.currentQuestion -= 1;
      renderQuestion();
    }
  });

  function restartAll() {
    introForm.reset();
    ageError.hidden = true;
    parentNote.hidden = true;
    state.currentQuestion = 0;
    state.answers = new Array(QUESTIONS.length).fill(null);
    showScreen("intro");
  }

  btnRestartMid.addEventListener("click", restartAll);
  btnRestartEnd.addEventListener("click", restartAll);

  /* ==========================================================
     RESULTS SCREEN
     ========================================================== */
  function computeAndShowResults() {
    var scores = { ai: 0, biz: 0, creative: 0, pm: 0, innov: 0 };
    state.answers.forEach(function (key) {
      if (key && scores.hasOwnProperty(key)) scores[key] += 1;
    });

    var ranked = STUDIO_ORDER.slice().sort(function (a, b) {
      return scores[b] - scores[a];
    });

    var topKey = ranked[0];
    var secondKey = ranked[1];
    var top = STUDIOS[topKey];
    var second = STUDIOS[secondKey];

    var namePossessive = state.childName ? state.childName : "This student";
    var pronounSubject = state.childName ? state.childName : "They";

    document.getElementById("results-eyebrow").textContent =
      state.respondent === "parent" ? "Recommended Studio for " + namePossessive : "Your Recommended Studio";
    document.getElementById("result-icon").textContent = top.icon;
    document.getElementById("result-title").textContent = top.name;
    document.getElementById("result-summary").textContent = top.summary;
    document.getElementById("result-description").textContent = top.description;

    var skillsList = document.getElementById("result-skills");
    skillsList.innerHTML = "";
    top.skills.forEach(function (skill) {
      var li = document.createElement("li");
      li.textContent = skill;
      skillsList.appendChild(li);
    });

    var secondaryCard = document.getElementById("secondary-card");
    var maxScore = QUESTIONS.length;
    var showSecondary = scores[secondKey] > 0 && scores[secondKey] >= scores[topKey] * 0.5;
    if (showSecondary) {
      secondaryCard.hidden = false;
      document.getElementById("secondary-title").textContent = second.name;
      document.getElementById("secondary-description").textContent =
        pronounSubject + " also " + (state.childName ? "shows" : "show") +
        " real strength in " + second.name.replace(" Studio", "") +
        " — " + second.summary.replace(/^A natural fit for /, "particularly as ");
    } else {
      secondaryCard.hidden = true;
    }

    var profileBars = document.getElementById("profile-bars");
    profileBars.innerHTML = "";
    ranked.forEach(function (key) {
      var studio = STUDIOS[key];
      var pct = Math.round((scores[key] / maxScore) * 100);
      var row = document.createElement("div");
      row.className = "profile-bar-row";

      var label = document.createElement("div");
      label.className = "profile-bar-label";
      var nameSpan = document.createElement("span");
      nameSpan.textContent = studio.icon + "  " + studio.name;
      var pctSpan = document.createElement("span");
      pctSpan.textContent = pct + "%";
      label.appendChild(nameSpan);
      label.appendChild(pctSpan);

      var track = document.createElement("div");
      track.className = "profile-bar-track";
      var fill = document.createElement("div");
      fill.className = "profile-bar-fill";
      fill.style.background = "var(" + studio.color + ")";
      track.appendChild(fill);

      row.appendChild(label);
      row.appendChild(track);
      profileBars.appendChild(row);

      // animate on next tick
      window.requestAnimationFrame(function () {
        fill.style.width = pct + "%";
      });
    });

    document.getElementById("cta-name").textContent = state.childName || "your child";

    var subject = encodeURIComponent("Astra Kids Academy — Learning Pathway Assessment Result");
    var bodyLines = [
      "Learning Pathway Assessment result" + (state.childName ? " for " + state.childName : "") + " (age " + state.childAge + "):",
      "",
      "Recommended studio: " + top.name,
      showSecondary ? "Also strong in: " + second.name : "",
      "",
      "Full profile:"
    ].concat(ranked.map(function (key) {
      return "- " + STUDIOS[key].name + ": " + Math.round((scores[key] / maxScore) * 100) + "%";
    }));
    var body = encodeURIComponent(bodyLines.filter(Boolean).join("\n"));
    btnEmail.href = "mailto:?subject=" + subject + "&body=" + body;

    showScreen("results");
  }

  btnPrint.addEventListener("click", function () {
    window.print();
  });

})();
