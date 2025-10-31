document.addEventListener("DOMContentLoaded", () => {
  // Inicializar AOS
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

  // Intersection Observer ajustado
  const observerOptions = {
    threshold: 0.3,
    rootMargin: "0px",
  };

  const observer = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        // Animar progress bars
        if (entry.target.tagName === "PROGRESS") {
          animateProgressBar(entry.target);
          observer.unobserve(entry.target);
        }
        // Animar contadores
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
  const progressBars = document.querySelectorAll(
    "progress[data-progress-value]"
  );
  progressBars.forEach((progress) => {
    progress.setAttribute("value", "0"); // Começar do zero
    observer.observe(progress);
  });

  // Função para animar progress bar
  function animateProgressBar(progress) {
    const targetValue = Number(progress.getAttribute("data-progress-value"));
    const maxValue = Number(progress.getAttribute("max")) || 100;
    const duration = 1500; // 1.5 segundos
    const startTime = performance.now();
    const startValue = 0;

    function updateProgress(currentTime) {
      const elapsed = currentTime - startTime;
      const progressPct = Math.min(elapsed / duration, 1);

      // Easing function (ease-out)
      const eased = 1 - Math.pow(1 - progressPct, 3);

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

  // Observar todos os contadores
  const countupNodes = document.querySelectorAll(".countup");
  countupNodes.forEach((el) => {
    observer.observe(el);
  });

  // Função para iniciar contador
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

    // tenta encontrar o constructor de CountUp em várias formas comuns
    const tryGetCountUpCtor = () => {
      if (typeof window.CountUp === "function") return window.CountUp;
      if (window.CountUp && typeof window.CountUp.CountUp === "function")
        return window.CountUp.CountUp;
      if (typeof window.countUp === "function") return window.countUp;
      if (window.countUp && typeof window.countUp.CountUp === "function")
        return window.countUp.CountUp;
      return null;
    };

    const CountUpCtor = tryGetCountUpCtor();

    // Função fallback manual que anima usando requestAnimationFrame
    const manualCountUp = (element, to, opts) => {
      const durationMs = Math.max(300, (opts.duration || 1.6) * 1000);
      const startTime = performance.now();
      const startVal = 0;
      const decimals = opts.decimalPlaces || 0;

      function formatValue(v) {
        // usa Intl para formatação pt-BR (se disponível)
        try {
          return (
            (opts.prefix || "") +
            Number(v).toLocaleString("pt-BR", {
              minimumFractionDigits: decimals,
              maximumFractionDigits: decimals,
            }) +
            (opts.suffix || "")
          );
        } catch {
          // fallback simples
          return (
            (opts.prefix || "") +
            Number(v).toFixed(decimals) +
            (opts.suffix || "")
          );
        }
      }

      function step(now) {
        const elapsed = now - startTime;
        const t = Math.min(1, elapsed / durationMs);
        // easeOutCubic
        const eased = 1 - Math.pow(1 - t, 3);
        const current = startVal + (to - startVal) * eased;
        element.textContent = formatValue(current);
        if (t < 1) requestAnimationFrame(step);
        else element.textContent = formatValue(to);
      }

      requestAnimationFrame(step);
    };

    // Tenta usar a lib CountUp. Se falhar, usa fallback manual.
    if (CountUpCtor) {
      try {
        // Alguns builds aceitam elemento, outros pedem id — tentamos ambos
        let instance = null;
        try {
          instance = new CountUpCtor(el, endVal, options);
        } catch (errInner) {
          // tenta passando id em última instância
          const maybeId = el.id ? el.id : null;
          if (maybeId) instance = new CountUpCtor(maybeId, endVal, options);
          else throw errInner;
        }

        if (!instance.error) {
          instance.start();
          return;
        } else {
          // se teve erro, cai para manual
          console.warn("CountUp instance error:", instance.error);
        }
      } catch (err) {
        console.warn("CountUp failed, fallback to manual. Error:", err);
        // prossegue para fallback
      }
    }

    // fallback manual
    manualCountUp(el, endVal, options);
  }

  // Verificação pós-load para contadores já visíveis no carregamento
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

  // Chart.js - gráfico mensal com valores aleatórios
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

          const chart = new window.Chart(ctx, {
            type: "bar",
            data: {
              labels: meses,
              datasets: [
                {
                  label: "Vendas",
                  data: dadosAleatorios,
                  backgroundColor: "rgba(96, 165, 250, 0.6)", // azul claro
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
                legend: {
                  labels: { color: "#e5e7eb" },
                },
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
