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
        cargarUltimoFolio(); // cargar folio al iniciar
    } else {
        alert("Contraseña incorrecta. No se puede acceder.");
        window.location.href = "index.html";
    }
};

// 🔹 Cargar último folio registrado
function cargarUltimoFolio() {
    const ref = database.ref("recibos").orderByChild("folio").limitToLast(1);
    ref.once("value", snapshot => {
        let ultimoFolio = 0;
        snapshot.forEach(child => {
            ultimoFolio = parseInt(child.val().folio) || 0;
        });
        document.getElementById("ultimoFolio").textContent = `Último folio registrado: ${ultimoFolio}`;
        document.getElementById("folio").value = ultimoFolio + 1; // prellenar el siguiente folio
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
        .then(() => {
            console.log("Datos enviados correctamente.");
            cargarUltimoFolio(); // actualizar contador después de guardar
        })
        .catch(error => console.error("Error al enviar datos:", error));
}

// 🔹 Formato de fecha
function formatDate(dateString) {
    const [year, month, day] = dateString.split("-");
    return `${year}-${month}-${day}`;
}

// 🔹 Formato de hora
function formatoHora(hora24) {
    const [hora, minutos] = hora24.split(":");
    const h = parseInt(hora, 10);
    const ampm = h >= 12 ? "PM" : "AM";
    const hora12 = h % 12 || 12;
    return `${hora12}:${minutos} ${ampm}`;
}

// 🔹 Generar recibo
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
    const ropaEntregada = document.getElementById("descripcion").value.trim() || "No especificada";

    // ⚠️ Validaciones
    if (!folio || !cliente || !kilos || !fechaIngresoRaw || !total || !fechaEntregaRaw || !horaEntregaRaw || !estado || !metodoPago) {
        alert("Por favor, complete todos los campos.");
        return;
    }

    const fechaIngreso = formatDate(fechaIngresoRaw);
    const fechaEntrega = formatDate(fechaEntregaRaw);
    const horaEntrega = formatoHora(horaEntregaRaw);

    enviarDatosAFirebase(cliente, folio, fechaIngreso, total, servicio, kilos, fechaEntrega, horaEntrega, ropaEntregada, 0, estado, metodoPago);

    document.getElementById("recibo").innerHTML = `
        <h2>Gracias por visitar Chicos Washing.</h2>
        <h3>Nosotros nos preocupamos por tus prendas.</h3>
        <h4 style="color: red;">"Usted acepta que, presentará este recibo para recibir su ropa. Sin él NO debemos entregarla. Gracias".</h4>
        <p><strong>Folio:</strong> <span class="folio">${folio}</span></p>
        <p><strong>Cliente:</strong> ${cliente}</p>
        <p><strong>Total:</strong> <span class="total">$${total}</span></p>
        <p><strong>Estado del pago:</strong> <span class="estado-pago">${estado}</span></p>
        <p><strong>Kilos:</strong> ${kilos} kg</p>
        <p><strong>Ropa:</strong> ${ropaEntregada}</p>
        <p><strong>Entrega:</strong> ${fechaEntrega}</p>
        <p><strong>Hora:</strong> ${horaEntrega}</p>
    `;

    document.getElementById("recibo").classList.remove("hidden");
    document.getElementById("recibo").scrollIntoView({ behavior: 'smooth' });
}