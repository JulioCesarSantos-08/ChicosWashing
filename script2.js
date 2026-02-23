// =======================================
// SCRIPT 2 - Tintorería y Artículos Especiales
// Chicos Washing
// =======================================

// ===============================
// 🔢 CÁLCULO DEL TOTAL GENERAL
// ===============================
function activarCalculoExtras() {

    const kilosInput = document.getElementById("kilos");
    const totalInput = document.getElementById("total");

    if (!kilosInput || !totalInput) return;

    const tintoreriaInputs = document.querySelectorAll(".tintoreria");
    const especialesInputs = document.querySelectorAll(".especiales");

    function calcularTotalGeneral() {
        const kilos = parseFloat(kilosInput.value) || 0;
        let total = kilos * 18;

        // Tintorería
        tintoreriaInputs.forEach(input => {
            const cantidad = parseInt(input.value) || 0;
            const precio = parseFloat(input.dataset.precio) || 0;
            total += cantidad * precio;
        });

        // Artículos especiales
        especialesInputs.forEach(input => {
            const cantidad = parseInt(input.value) || 0;
            const precio = parseFloat(input.dataset.precio) || 0;
            total += cantidad * precio;
        });

        // ⚠️ No sobrescribir si el usuario editó manualmente
        if (!totalInput.dataset.editado) {
            totalInput.value = total;
        }
    }

    kilosInput.addEventListener("input", calcularTotalGeneral);

    tintoreriaInputs.forEach(input =>
        input.addEventListener("input", calcularTotalGeneral)
    );

    especialesInputs.forEach(input =>
        input.addEventListener("input", calcularTotalGeneral)
    );
}

// ===============================
// 🧾 DESCRIPCIÓN DE TINTORERÍA
// ===============================
function generarDescripcionTintoreria() {
    const inputs = document.querySelectorAll(".tintoreria");
    let lista = [];

    inputs.forEach(input => {
        const cantidad = parseInt(input.value) || 0;
        if (cantidad <= 0) return;

        const precio = parseFloat(input.dataset.precio) || 0;
        const label = input.previousElementSibling;
        const nombre = label ? label.textContent.replace(":", "") : "Artículo";

        lista.push(`${nombre}: ${cantidad} × $${precio} = $${cantidad * precio}`);
    });

    return lista.length
        ? `<strong>Tintorería:</strong><br>${lista.join("<br>")}`
        : "";
}

// ===============================
// 🧾 DESCRIPCIÓN DE ARTÍCULOS ESPECIALES
// ===============================
function generarDescripcionEspeciales() {
    const inputs = document.querySelectorAll(".especiales");
    let lista = [];

    inputs.forEach(input => {
        const cantidad = parseInt(input.value) || 0;
        if (cantidad <= 0) return;

        const precio = parseFloat(input.dataset.precio) || 0;
        const label = input.previousElementSibling;
        const nombre = label ? label.textContent.replace(":", "") : "Artículo";

        lista.push(`${nombre}: ${cantidad} × $${precio} = $${cantidad * precio}`);
    });

    return lista.length
        ? `<strong>Artículos especiales:</strong><br>${lista.join("<br>")}`
        : "";
}

// ===============================
// 🧾 DETALLE COMPLETO PARA RECIBO
// ===============================
function generarDetalleCompletoServicio(kilos) {

    let detalle = [];

    if (kilos > 0) {
        detalle.push(`<strong>Lavado por kilo:</strong> ${kilos} kg → $${kilos * 18}`);
    }

    const tintoreria = generarDescripcionTintoreria();
    const especiales = generarDescripcionEspeciales();

    if (tintoreria) detalle.push(tintoreria);
    if (especiales) detalle.push(especiales);

    return detalle.join("<br><br>");
}
