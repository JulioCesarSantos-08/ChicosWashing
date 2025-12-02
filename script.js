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

        // ⬅️ Activar cálculo automático del total
        activarCalculoTotal();
    } else {
        alert("Contraseña incorrecta. No se puede acceder.");
        window.location.href = "index.html";
    }
};

// 🔹 Cargar último folio
function cargarUltimoFolio() {
    const ref = database.ref("recibos").orderByChild("folio").limitToLast(1);
    ref.once("value", snapshot => {
        let ultimoFolio = 0;
        snapshot.forEach(child => {
            ultimoFolio = parseInt(child.val().folio) || 0;
        });
        document.getElementById("ultimoFolio").textContent = `Último folio registrado: ${ultimoFolio}`;
        document.getElementById("folio").value = ultimoFolio + 1;
    });
}

// 🔹 Activar cálculo automático de total (kilos × 18)
function activarCalculoTotal() {
    const kilosInput = document.getElementById("kilos");
    const totalInput = document.getElementById("total");

    // Cuando cambien los kilos → calcular total
    kilosInput.addEventListener("input", () => {
        const kilos = parseFloat(kilosInput.value) || 0;

        // Si el total NO ha sido modificado manualmente
        if (!totalInput.dataset.editado) {
            totalInput.value = kilos * 18;
        }
    });

    // Si el usuario escribe manualmente el total → dejar de autocalcular
    totalInput.addEventListener("input", () => {
        totalInput.dataset.editado = "true";
    });
}

// 🔹 Enviar datos a Firebase
function enviarDatosAFirebase(cliente, folio, fechaIngreso, total, servicio, kilos, fechaEntrega, horaEntrega, ropaEntregada, lavadas, estado, metodoPago) {
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

// 🔹 Formato fecha
function formatDate(dateString) {
    const [year, month, day] = dateString.split("-");
    return `${day}-${month}-${year}`;
}

// 🔹 Formato hora
function formatoHora(hora24) {
    if (!hora24) return "Sin hora asignada";
    const [hora, minutos] = hora24.split(":");
    const h = parseInt(hora, 10);
    const ampm = h >= 12 ? "PM" : "AM";
    const hora12 = h % 12 || 12;
    return `${hora12}:${minutos} ${ampm}`;
}

// 🔹 FECHA AUTOMÁTICA
function fechaActual() {
    const hoy = new Date();
    let d = hoy.getDate().toString().padStart(2, "0");
    let m = (hoy.getMonth() + 1).toString().padStart(2, "0");
    let y = hoy.getFullYear();
    return `${d}-${m}-${y}`;
}

// 🔹 GENERADOR AUTOMÁTICO DE DESCRIPCIÓN DE ROPA
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
            const cantidad = parseInt(document.getElementById(p.id).value) || 0;
            return cantidad > 0 ? `${cantidad} ${p.nombre}` : null;
        })
        .filter(x => x !== null);

    return lista.length > 0 ? lista.join(", ") : "No especificada";
}

// 🔹 GENERAR RECIBO
function generarRecibo() {

    // Obtener datos
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

    // Nueva descripción automática
    const ropaEntregada = generarDescripcionRopa();

    // Validación (SIN HORA)
    if (!folio || !cliente || !kilos || !fechaIngresoRaw || !total || !fechaEntregaRaw || !estado || !metodoPago) {
        alert("Por favor, complete todos los campos obligatorios.");
        return;
    }

    const fechaIngreso = formatDate(fechaIngresoRaw);
    const fechaEntrega = formatDate(fechaEntregaRaw);
    const horaEntrega = formatoHora(horaEntregaRaw);

    // Guardar en Firebase
    enviarDatosAFirebase(cliente, folio, fechaIngreso, total, servicio, kilos, fechaEntrega, horaEntrega, ropaEntregada, 0, estado, metodoPago);

    // Recibo visual
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
