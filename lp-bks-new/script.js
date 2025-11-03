// script.js
document.addEventListener("DOMContentLoaded", () => {
  /* =========================================================
     Inicializar AOS (animações on scroll)
  ========================================================= */
  if (window.AOS) {
    AOS.init({
      duration: 800,
      easing: "ease-in-out",
      once: true,
      offset: 120,
    });

    window.addEventListener("load", () => AOS.refreshHard());
    window.addEventListener("resize", () => AOS.refresh());
    window.addEventListener("scroll", () => AOS.refresh());
  }

  /* =========================================================
     Intersection Observer - anima progress bars e countups
  ========================================================= */
  const observerOptions = {
    threshold: 0.3,
    rootMargin: "0px",
  };

  const observer = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        // --- Progress bars ---
        if (entry.target.tagName === "PROGRESS") {
          animateProgressBar(entry.target);
          observer.unobserve(entry.target);
        }

        // --- CountUp ---
        if (
          entry.target.classList.contains("countup") &&
          !entry.target.hasAttribute("data-countup-started")
        ) {
          startCountUp(entry.target);
          entry.target.setAttribute("data-countup-started", "true");
          observer.unobserve(entry.target);
        }
      }
    });
  }, observerOptions);

  // Observar todos os progress bars
  document
    .querySelectorAll("progress[data-progress-value]")
    .forEach((progress) => {
      progress.setAttribute("value", "0");
      observer.observe(progress);
    });

  // Observar todos os contadores
  document.querySelectorAll(".countup").forEach((el) => observer.observe(el));

  /* =========================================================
     Função: animar progress bars
  ========================================================= */
  function animateProgressBar(progress) {
    const targetValue = Number(progress.getAttribute("data-progress-value"));
    const maxValue = Number(progress.getAttribute("max")) || 100;
    const duration = 1500;
    const startTime = performance.now();
    const startValue = 0;

    function updateProgress(currentTime) {
      const elapsed = currentTime - startTime;
      const progressPct = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progressPct, 3); // ease-out
      const currentValue = startValue + (targetValue - startValue) * eased;
      progress.setAttribute("value", Math.round(currentValue));

      if (progressPct < 1) {
        requestAnimationFrame(updateProgress);
      } else {
        progress.setAttribute("value", targetValue);
      }
    }

    requestAnimationFrame(updateProgress);
  }

  /* =========================================================
     Função: iniciar contador (CountUp.js)
  ========================================================= */
  function startCountUp(el) {
    const targetAttr = el.getAttribute("data-target");
    if (!targetAttr) return;

    const endVal = Number(targetAttr);
    if (Number.isNaN(endVal)) return;

    const prefix = el.getAttribute("data-prefix") || "";
    const suffix = el.getAttribute("data-suffix") || "";

    const decimals = (() => {
      const dot = targetAttr.indexOf(".");
      return dot >= 0 ? targetAttr.length - dot - 1 : 0;
    })();

    const options = {
      prefix,
      suffix,
      decimalPlaces: decimals,
      duration: 1.6,
      useEasing: true,
      useGrouping: true,
      separator: ".",
      decimal: ",",
    };

    // Detecta diferentes formas de importar CountUp
    const CountUpCtor =
      typeof window.CountUp === "function"
        ? window.CountUp
        : window.CountUp?.CountUp
        ? window.CountUp.CountUp
        : null;

    if (!CountUpCtor) {
      console.warn(
        "CountUp.js não encontrado. Verifique o import da biblioteca."
      );
      return;
    }

    try {
      const counter = new CountUpCtor(el, endVal, options);
      if (!counter.error) {
        counter.start();
      } else {
        console.error("Erro no CountUp:", counter.error);
      }
    } catch (err) {
      console.error("Falha ao iniciar CountUp:", err);
    }
  }

  /* =========================================================
     Verificação inicial (caso o elemento já esteja visível)
  ========================================================= */
  window.addEventListener("load", () => {
    document.querySelectorAll(".countup").forEach((el) => {
      if (el.hasAttribute("data-countup-started")) return;
      const rect = el.getBoundingClientRect();
      const inView = rect.top < window.innerHeight && rect.bottom > 0;
      if (inView) {
        startCountUp(el);
        el.setAttribute("data-countup-started", "true");
      }
    });
  });

  /* =========================================================
     Chart.js - gráfico de vendas
  ========================================================= */
  const chartCanvas = document.getElementById("salesChart");
  if (chartCanvas && window.Chart) {
    const chartObserver = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (
          entry.isIntersecting &&
          !chartCanvas.hasAttribute("data-chart-created")
        ) {
          const ctx = chartCanvas.getContext("2d");

          const meses = [
            "Jan",
            "Fev",
            "Mar",
            "Abr",
            "Mai",
            "Jun",
            "Jul",
            "Ago",
            "Set",
            "Out",
            "Nov",
            "Dez",
          ];
          const dadosAleatorios = meses.map(
            () => Math.floor(Math.random() * 100) + 20
          );

          new window.Chart(ctx, {
            type: "bar",
            data: {
              labels: meses,
              datasets: [
                {
                  label: "Vendas",
                  data: dadosAleatorios,
                  backgroundColor: "rgba(96, 165, 250, 0.6)",
                  borderColor: "rgba(96, 165, 250, 1)",
                  borderWidth: 1,
                },
              ],
            },
            options: {
              responsive: true,
              maintainAspectRatio: false,
              animation: {
                duration: 1500,
                easing: "easeOutQuart",
              },
              scales: {
                x: {
                  ticks: { color: "#e5e7eb" },
                  grid: { color: "rgba(229, 231, 235, 0.1)" },
                },
                y: {
                  beginAtZero: true,
                  ticks: { color: "#e5e7eb" },
                  grid: { color: "rgba(229, 231, 235, 0.1)" },
                },
              },
              plugins: {
                legend: { labels: { color: "#e5e7eb" } },
                tooltip: {
                  callbacks: {
                    label: (ctx) => `Vendas: ${ctx.parsed.y}`,
                  },
                },
              },
            },
          });

          chartCanvas.setAttribute("data-chart-created", "true");
          chartObserver.unobserve(chartCanvas);
        }
      });
    }, observerOptions);

    chartObserver.observe(chartCanvas);
  }
});
