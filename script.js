// 🔹 Configuración Firebase
const firebaseConfig = {
    apiKey: "AIzaSyARrW902od6klb3wL6wvvd9BJBxeveN0SY",
    authDomain: "chicos-washing.firebaseapp.com",
    databaseURL: "https://chicos-washing-default-rtdb.firebaseio.com",
    projectId: "chicos-washing",
    storageBucket: "chicos-washing.appspot.com",
    messagingSenderId: "243101499379",
    appId: "1:243101499379:web:aa7d15b8b433bd355a5c86"
};
firebase.initializeApp(firebaseConfig);
const database = firebase.database();

// 🔹 Bloqueo por contraseña
window.onload = function () {
    const clave = prompt("La página es privada, ingresa contraseña:");
    if (clave === "123456") {
        document.body.style.display = "flex";
        cargarUltimoFolio();
        activarCalculoTotal();
    } else {
        alert("Contraseña incorrecta. No se puede acceder.");
        window.location.href = "index.html";
    }
};

// 🔹 Cargar último folio (ARREGLADO)
function cargarUltimoFolio() {
    database.ref("recibos")
        .once("value", snapshot => {

            let mayor = 0;

            snapshot.forEach(child => {
                const f = parseInt(child.val().folio);
                if (!isNaN(f) && f > mayor) mayor = f;
            });

            document.getElementById("ultimoFolio").textContent =
                `Último folio registrado: ${mayor}`;

            document.getElementById("folio").value = mayor + 1;
        });
}

// 🔹 Cálculo automático del total (kilos × 18)
function activarCalculoTotal() {
    const kilosInput = document.getElementById("kilos");
    const totalInput = document.getElementById("total");

    kilosInput.addEventListener("input", () => {
        const kilos = parseFloat(kilosInput.value) || 0;

        if (!totalInput.dataset.editado) {
            totalInput.value = kilos * 18;
        }
    });

    totalInput.addEventListener("input", () => {
        totalInput.dataset.editado = "true";
    });
}

// 🔹 Enviar a Firebase
function enviarDatosAFirebase(cliente, folio, fechaIngreso, total, servicio, kilos,
    fechaEntrega, horaEntrega, ropaEntregada, lavadas, estado, metodoPago) {

    const reciboData = {
        cliente,
        folio,
        fechaIngreso,
        total,
        servicio,
        kilos,
        fechaEntrega,
        horaEntrega,
        ropaEntregada,
        lavadas,
        estado,
        metodoPago
    };

    database.ref("recibos").push(reciboData)
        .then(() => cargarUltimoFolio())
        .catch(error => console.error("Error al enviar datos:", error));
}

// 🔹 Fecha en formato bonito
function formatDate(dateString) {
    const [y, m, d] = dateString.split("-");
    return `${d}-${m}-${y}`;
}

// 🔹 Formato hora
function formatoHora(hora24) {
    if (!hora24) return "Sin hora asignada";
    const [h, min] = hora24.split(":");
    const hh = parseInt(h);
    const ampm = hh >= 12 ? "PM" : "AM";
    const h12 = hh % 12 || 12;
    return `${h12}:${min} ${ampm}`;
}

// 🔹 Fecha actual
function fechaActual() {
    const hoy = new Date();
    let d = hoy.getDate().toString().padStart(2, "0");
    let m = (hoy.getMonth() + 1).toString().padStart(2, "0");
    let y = hoy.getFullYear();
    return `${d}-${m}-${y}`;
}

// 🔹 Generar descripción automática
function generarDescripcionRopa() {
    const prendas = [
        { id: "playeras", nombre: "Playeras" },
        { id: "pantalones", nombre: "Pantalones" },
        { id: "shorts", nombre: "Shorts" },
        { id: "tenis", nombre: "Tenis" },
        { id: "camisas", nombre: "Camisas" },
        { id: "abrigos", nombre: "Suéteres" },
        { id: "calcetines", nombre: "Calcetines" },
        { id: "vestidos", nombre: "Vestidos" },
        { id: "toallas", nombre: "Toallas" },
        { id: "sabanas", nombre: "Sábanas" },
        { id: "cobijas", nombre: "Edredones" },
        { id: "gorras", nombre: "Gorras" },
        { id: "blusas", nombre: "Blusas" },
        { id: "camisetas", nombre: "Camisetas" },
        { id: "faldas", nombre: "Faldas" },
        { id: "chalecos", nombre: "Chalecos" },
        { id: "mochilas", nombre: "Mochilas" },
        { id: "boxers", nombre: "Boxers" }
    ];

    let lista = prendas
        .map(p => {
            const cant = parseInt(document.getElementById(p.id).value) || 0;
            return cant > 0 ? `${cant} ${p.nombre}` : null;
        })
        .filter(x => x);

    // Campo MANUAL extra
    const manual = document.getElementById("descripcionManual")?.value.trim();

    if (manual) lista.push(manual);

    return lista.length > 0 ? lista.join(", ") : "No especificada";
}

// 🔹 Generar Recibo
function generarRecibo() {

    const cliente = document.getElementById("cliente").value.trim();
    const servicio = document.getElementById("lavanderia").value;
    const kilos = document.getElementById("kilos").value;
    const folio = document.getElementById("folio").value.trim();
    const fechaIngresoRaw = document.getElementById("fechaIngreso").value;
    const total = document.getElementById("total").value;
    const fechaEntregaRaw = document.getElementById("fechaEntrega").value;
    const horaEntregaRaw = document.getElementById("horaEntrega").value;
    const estado = document.getElementById("estado").value;
    const metodoPago = document.getElementById("metodoPago").value;

    const ropaEntregada = generarDescripcionRopa();

    if (!folio || !cliente || !kilos || !fechaIngresoRaw || !total || !fechaEntregaRaw) {
        alert("Por favor, complete todos los campos obligatorios.");
        return;
    }

    const fechaIngreso = formatDate(fechaIngresoRaw);
    const fechaEntrega = formatDate(fechaEntregaRaw);
    const horaEntrega = formatoHora(horaEntregaRaw);

    enviarDatosAFirebase(
        cliente, folio, fechaIngreso, total, servicio, kilos,
        fechaEntrega, horaEntrega, ropaEntregada, 0, estado, metodoPago
    );

    document.getElementById("recibo").innerHTML = `
        <div class="recibo-header">
            <img src="imagenes/logo1.png" class="recibo-logo">
            <div>
                <div class="recibo-titulo">CHICOS WASHING</div>
                <small>Los maestros de la lavandería</small><br>
                <small>Fecha: ${fechaActual()}</small>
            </div>
        </div>

        <div class="linea"></div>

        <div class="datos-recibo">
            <p><strong>Folio:</strong> <span class="folio">${folio}</span></p>
            <p><strong>Cliente:</strong> ${cliente}</p>
            <p><strong>Servicio:</strong> ${servicio}</p>
            <p><strong>Kilos:</strong> ${kilos} kg</p>
            <p><strong>Ropa entregada:</strong> ${ropaEntregada}</p>
            <p><strong>Total a pagar:</strong> <span class="total">$${total}</span></p>
            <p><strong>Estado del pago:</strong> <span class="estado-pago">${estado}</span></p>
            <p><strong>Método de pago:</strong> ${metodoPago}</p>
            <p><strong>Fecha ingreso:</strong> ${fechaIngreso}</p>
            <p><strong>Fecha entrega:</strong> ${fechaEntrega}</p>
            <p><strong>Hora entrega:</strong> ${horaEntrega}</p>
        </div>

        <div class="linea"></div>

        <div class="recibo-footer">
            <p><strong>Tel:</strong> +52 222 330 8607</p>
            <p>¡Gracias por su preferencia!</p>
        </div>
    `;

    document.getElementById("recibo").classList.remove("hidden");
    document.getElementById("recibo").scrollIntoView({ behavior: 'smooth' });
}
