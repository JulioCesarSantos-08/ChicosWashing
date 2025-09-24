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
const db = firebase.database();
const lista = document.getElementById("lista-recibos");
const totalGanancias = document.getElementById("total-ganancias");
let chart;

// ================= FUNCIONES ================= //
function mostrarRecibos() {
  const desde = document.getElementById("filtroDesde").value;
  const hasta = document.getElementById("filtroHasta").value;

  db.ref("recibos").once("value", (snapshot) => {
    db.ref("gastos").once("value", (gastosSnap) => {
      lista.innerHTML = "";
      let totalIngresos = 0;
      let totalGastos = 0;
      const gananciasPorDia = {};
      const gastosPorDia = {};

      const desdeFecha = desde ? new Date(desde + "T00:00:00") : null;
      const hastaFecha = hasta ? new Date(hasta + "T23:59:59") : null;

      const recibosArray = [];

      if (snapshot.exists()) {
        snapshot.forEach((child) => {
          const recibo = child.val();
          const clave = child.key;
          const fechaEntrega = new Date(recibo.fechaEntrega + "T00:00:00");
          const mostrar = (!desdeFecha || fechaEntrega >= desdeFecha) && (!hastaFecha || fechaEntrega <= hastaFecha);

          if (mostrar) {
            recibosArray.push({ clave, recibo });
          }
        });
      }

      recibosArray.sort((a, b) => (parseInt(a.recibo.folio) || 0) - (parseInt(b.recibo.folio) || 0));

      recibosArray.forEach(({ clave, recibo }) => {
        const estaPagado = recibo.estado === "pagado";
        if (estaPagado) {
          totalIngresos += parseFloat(recibo.total);
          const dia = recibo.fechaEntrega;
          gananciasPorDia[dia] = (gananciasPorDia[dia] || 0) + parseFloat(recibo.total);
        }

        const div = document.createElement("div");
        div.className = "recibo-item";
        div.innerHTML = `
          <strong>Folio:</strong> ${recibo.folio}<br>
          <strong>Cliente:</strong> ${recibo.cliente}<br>
          <strong>Sucursal:</strong> ${recibo.servicio}<br>
          <strong>Kilos:</strong> ${recibo.kilos} kg<br>
          <strong>Total:</strong> $${recibo.total}<br>
          <strong>Ingreso:</strong> ${recibo.fechaIngreso}<br>
          <strong>Entrega:</strong> ${recibo.fechaEntrega} ${recibo.horaEntrega}<br>
          <strong>Ropa:</strong> ${recibo.ropaEntregada}<br>
          <strong>Estado:</strong> ${recibo.estado || "pendiente"}<br>
          <strong>Método de Pago:</strong> <span style="color: ${recibo.metodoPago === 'transferencia' ? 'orange' : 'green'};">
          ${recibo.metodoPago || 'no especificado'}
          </span><br>
          <button onclick="alternarMetodoPago('${clave}')">Cambiar Método de Pago</button>
          <button onclick="editarRecibo('${clave}')">Editar</button>
          <button onclick="eliminarRecibo('${clave}')">Eliminar</button>
          ${
            recibo.estado !== "pagado" && recibo.estado !== "pedido listo"
              ? `<button onclick="marcarComoPagado('${clave}')">Sin pagar</button>`
              : `<button style="background-color: green; color: white;" onclick="marcarComoPendiente('${clave}')">Pagado</button>`
          }
        `;
        lista.appendChild(div);
      });

      if (gastosSnap.exists()) {
        gastosSnap.forEach((g) => {
          const gasto = g.val();
          const claveGasto = g.key;
          const fechaGasto = new Date(gasto.fecha + "T00:00:00");

          const mostrarGasto = (!desdeFecha || fechaGasto >= desdeFecha) && (!hastaFecha || fechaGasto <= hastaFecha);

          if (mostrarGasto) {
            totalGastos += parseFloat(gasto.monto);
            const dia = gasto.fecha;
            gastosPorDia[dia] = (gastosPorDia[dia] || 0) + parseFloat(gasto.monto);

            const div = document.createElement("div");
            div.className = "recibo-item";
            div.style.backgroundColor = "#fff0f0";
            div.innerHTML = `
              <strong>GASTO:</strong><br>
              <strong>Descripción:</strong> ${gasto.descripcion}<br>
              <strong>Monto:</strong> $${gasto.monto}<br>
              <strong>Fecha:</strong> ${gasto.fecha}<br>
              <strong>Sucursal:</strong> ${gasto.sucursal || "No especificada"}<br>
              <strong>Categoría:</strong> ${gasto.categoria || 'no especificada'}<br>
              <button onclick="editarGasto('${claveGasto}')">Editar</button>
              <button onclick="eliminarGasto('${claveGasto}')">Eliminar</button>
            `;
            lista.appendChild(div);
          }
        });
      }

      totalGanancias.textContent = `Ganancia Neta: $${(totalIngresos - totalGastos).toFixed(2)}`;

      const fechasUnicas = [...new Set([...Object.keys(gananciasPorDia), ...Object.keys(gastosPorDia)])].sort();
      const datosGraficos = {};
      fechasUnicas.forEach((fecha) => {
        const ingreso = gananciasPorDia[fecha] || 0;
        const gasto = gastosPorDia[fecha] || 0;
        datosGraficos[fecha] = ingreso - gasto;
      });

      actualizarGrafica(datosGraficos);
    });
  });
}

// ================= GRAFICA ================= //
function actualizarGrafica(datos) {
  const ctx = document.getElementById("miGrafica");
  if (!ctx) return;

  const labels = Object.keys(datos);
  const valores = Object.values(datos);

  if (chart) chart.destroy();

  chart = new Chart(ctx.getContext("2d"), {
    type: "line",
    data: {
      labels: labels,
      datasets: [{
        label: "Ganancia Neta",
        data: valores,
        borderColor: "green",
        backgroundColor: "rgba(0, 128, 0, 0.2)",
        fill: true,
        tension: 0.3
      }]
    },
    options: {
      responsive: true,
      plugins: { legend: { display: true } },
      scales: { y: { beginAtZero: true } }
    }
  });
}

// ================= BOTONES RECIBOS ================= //
function eliminarRecibo(clave) {
  if (confirm("¿Seguro que deseas eliminar este recibo?")) {
    db.ref("recibos/" + clave).remove().then(mostrarRecibos);
  }
}

function editarRecibo(clave) {
  const nuevoCliente = prompt("Nuevo nombre del cliente:");
  if (nuevoCliente) {
    db.ref("recibos/" + clave).update({ cliente: nuevoCliente }).then(mostrarRecibos);
  }
}

function alternarMetodoPago(clave) {
  db.ref("recibos/" + clave).once("value").then((snap) => {
    if (snap.exists()) {
      const metodoActual = snap.val().metodoPago || "efectivo";
      const nuevoMetodo = metodoActual === "efectivo" ? "transferencia" : "efectivo";
      db.ref("recibos/" + clave).update({ metodoPago: nuevoMetodo }).then(mostrarRecibos);
    }
  });
}

function marcarComoPagado(clave) {
  db.ref("recibos/" + clave).update({ estado: "pagado" }).then(mostrarRecibos);
}

function marcarComoPendiente(clave) {
  db.ref("recibos/" + clave).update({ estado: "pendiente" }).then(mostrarRecibos);
}

// ================= BOTONES GASTOS ================= //
function eliminarGasto(clave) {
  if (confirm("¿Seguro que deseas eliminar este gasto?")) {
    db.ref("gastos/" + clave).remove().then(mostrarRecibos);
  }
}

function editarGasto(clave) {
  const nuevaDescripcion = prompt("Nueva descripción:");
  const nuevoMonto = prompt("Nuevo monto:");
  if (nuevaDescripcion && nuevoMonto) {
    db.ref("gastos/" + clave).update({
      descripcion: nuevaDescripcion,
      monto: parseFloat(nuevoMonto)
    }).then(mostrarRecibos);
  }
}

function registrarGasto() {
  const descripcion = document.getElementById("descripcionGasto").value;
  const monto = document.getElementById("montoGasto").value;
  const fecha = document.getElementById("fechaGasto").value;
  const categoria = document.getElementById("categoriaGasto").value;
  const sucursal = document.getElementById("sucursalGasto").value;

  if (!descripcion || !monto || !fecha || !sucursal) {
    alert("Por favor completa todos los campos del gasto.");
    return;
  }

  const nuevoGasto = { descripcion, monto: parseFloat(monto), fecha, categoria: categoria || "general", sucursal };

  db.ref("gastos").push(nuevoGasto).then(() => {
    document.getElementById("descripcionGasto").value = "";
    document.getElementById("montoGasto").value = "";
    document.getElementById("fechaGasto").value = "";
    document.getElementById("categoriaGasto").value = "";
    document.getElementById("sucursalGasto").value = "";
    mostrarRecibos();
  });
}

// ================= FUNCIONES ADICIONALES ================= //
function eliminarFiltrados() {
  const desde = document.getElementById("filtroDesde").value;
  const hasta = document.getElementById("filtroHasta").value;
  if (!confirm("¿Seguro que deseas eliminar todos los recibos pagados y gastos filtrados?")) return;

  const desdeFecha = desde ? new Date(desde + "T00:00:00") : null;
  const hastaFecha = hasta ? new Date(hasta + "T23:59:59") : null;

  // Solo eliminar recibos PAGADOS
  db.ref("recibos").once("value", (snapshot) => {
    snapshot.forEach((child) => {
      const recibo = child.val();
      const fechaEntrega = new Date(recibo.fechaEntrega + "T00:00:00");
      if (
        recibo.estado === "pagado" &&
        (!desdeFecha || fechaEntrega >= desdeFecha) &&
        (!hastaFecha || fechaEntrega <= hastaFecha)
      ) {
        db.ref("recibos/" + child.key).remove();
      }
    });
  });

  // Eliminar gastos siempre
  db.ref("gastos").once("value", (snapshot) => {
    snapshot.forEach((child) => {
      const gasto = child.val();
      const fechaGasto = new Date(gasto.fecha + "T00:00:00");
      if ((!desdeFecha || fechaGasto >= desdeFecha) && (!hastaFecha || fechaGasto <= hastaFecha)) {
        db.ref("gastos/" + child.key).remove();
      }
    });
  }).then(mostrarRecibos);
}

function exportarAExcel() {
  const wb = XLSX.utils.book_new();

  db.ref("recibos").once("value", (recSnap) => {
    db.ref("gastos").once("value", (gastosSnap) => {
      const recibosSucursal1 = [];
      const recibosSucursal2 = [];
      const gastosSucursal1 = [];
      const gastosSucursal2 = [];

      recSnap.forEach((r) => {
        const recibo = r.val();
        if (recibo.servicio === "Lavandería 1") {
          recibosSucursal1.push(recibo);
        } else {
          recibosSucursal2.push(recibo);
        }
      });

      gastosSnap.forEach((g) => {
        const gasto = g.val();
        if (gasto.sucursal === "Lavandería 1") {
          gastosSucursal1.push(gasto);
        } else {
          gastosSucursal2.push(gasto);
        }
      });

      const ws1 = XLSX.utils.json_to_sheet(recibosSucursal1);
      const ws2 = XLSX.utils.json_to_sheet(recibosSucursal2);
      const ws3 = XLSX.utils.json_to_sheet(gastosSucursal1);
      const ws4 = XLSX.utils.json_to_sheet(gastosSucursal2);

      XLSX.utils.book_append_sheet(wb, ws1, "Recibos Sucursal 1");
      XLSX.utils.book_append_sheet(wb, ws2, "Recibos Sucursal 2");
      XLSX.utils.book_append_sheet(wb, ws3, "Gastos Sucursal 1");
      XLSX.utils.book_append_sheet(wb, ws4, "Gastos Sucursal 2");

      XLSX.writeFile(wb, "recibos_gastos.xlsx");
    });
  });
}

// ================= EXPONER FUNCIONES A WINDOW ================= //
window.eliminarRecibo = eliminarRecibo;
window.editarRecibo = editarRecibo;
window.alternarMetodoPago = alternarMetodoPago;
window.marcarComoPagado = marcarComoPagado;
window.marcarComoPendiente = marcarComoPendiente;
window.eliminarGasto = eliminarGasto;
window.editarGasto = editarGasto;
window.registrarGasto = registrarGasto;
window.eliminarFiltrados = eliminarFiltrados;
window.exportarAExcel = exportarAExcel;

// ================= EVENTOS ================= //
document.getElementById("filtroDesde").addEventListener("change", mostrarRecibos);
document.getElementById("filtroHasta").addEventListener("change", mostrarRecibos);
window.onload = mostrarRecibos;