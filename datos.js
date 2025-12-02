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
          <strong>Entrega:</strong> ${recibo.fechaEntrega} ${recibo.horaEntrega || ''}<br>
          <strong>Ropa:</strong> ${recibo.ropaEntregada}<br>
          <strong>Estado:</strong> ${recibo.estado || "pendiente"}<br>
          <strong>Método de Pago:</strong> <span style="color: ${recibo.metodoPago === 'transferencia' ? 'orange' : 'green'};">
          ${recibo.metodoPago || 'no especificado'}
          </span><br>
          <button onclick="verRecibo('${clave}')">Ver</button>
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

function verRecibo(clave) {
  db.ref("recibos/" + clave).once("value").then((snap) => {
    if (!snap.exists()) return;
    const r = snap.val();

    const html = `
      <div style="background:#fff;padding:18px;border-radius:8px;width:100%;max-width:520px;box-shadow:0 6px 18px rgba(0,0,0,0.2);">
        <div style="display:flex;align-items:center;gap:12px;">
          <img src="imagenes/logo1.png" alt="logo" style="width:64px;height:64px;object-fit:contain;">
          <div>
            <div style="font-size:18px;font-weight:700;">CHICOS WASHING</div>
            <div style="font-size:12px;color:#555;">Los maestros de la lavandería</div>
            <div style="font-size:12px;color:#555;">Fecha: ${new Date().toLocaleDateString()}</div>
          </div>
        </div>
        <hr style="margin:12px 0;border:none;border-top:1px solid #eee;">
        <div style="font-size:14px;color:#222;">
          <p style="margin:6px 0;"><strong>Folio:</strong> ${r.folio}</p>
          <p style="margin:6px 0;"><strong>Cliente:</strong> ${r.cliente}</p>
          <p style="margin:6px 0;"><strong>Sucursal:</strong> ${r.servicio}</p>
          <p style="margin:6px 0;"><strong>Kilos:</strong> ${r.kilos} kg</p>
          <p style="margin:6px 0;"><strong>Ropa entregada:</strong> ${r.ropaEntregada}</p>
          <p style="margin:6px 0;"><strong>Total a pagar:</strong> $${r.total}</p>
          <p style="margin:6px 0;"><strong>Estado:</strong> ${r.estado || 'pendiente'}</p>
          <p style="margin:6px 0;"><strong>Método de pago:</strong> ${r.metodoPago || 'no especificado'}</p>
          <p style="margin:6px 0;"><strong>Fecha ingreso:</strong> ${r.fechaIngreso}</p>
          <p style="margin:6px 0;"><strong>Fecha entrega:</strong> ${r.fechaEntrega}</p>
          <p style="margin:6px 0;"><strong>Hora entrega:</strong> ${r.horaEntrega || 'Sin hora asignada'}</p>
        </div>
        <div style="text-align:center;margin-top:12px;">
          <button id="cerrarVistaRecibo">Cerrar</button>
        </div>
      </div>
    `;

    const modal = document.getElementById("modalVerRecibo");
    const cont = document.getElementById("vistaRecibo");
    if (!modal || !cont) return;
    cont.innerHTML = html;
    modal.style.display = "flex";
    modal.style.position = "fixed";
    modal.style.top = "0";
    modal.style.left = "0";
    modal.style.width = "100%";
    modal.style.height = "100%";
    modal.style.justifyContent = "center";
    modal.style.alignItems = "center";
    modal.style.background = "rgba(0,0,0,0.5)";
    const btn = document.getElementById("cerrarVistaRecibo");
    btn.onclick = () => {
      modal.style.display = "none";
      cont.innerHTML = "";
    };
  });
}

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

function eliminarRecibo(clave) {
  if (confirm("¿Seguro que deseas eliminar este recibo?")) {
    db.ref("recibos/" + clave).remove().then(mostrarRecibos);
  }
}

function editarRecibo(clave) {
  db.ref("recibos/" + clave).once("value").then((snap) => {
    if (!snap.exists()) return;

    const r = snap.val();

    // Pedimos todos los campos, prellenados
    const nuevoCliente = prompt("Editar nombre del cliente:", r.cliente);
    if (nuevoCliente === null) return;

    const nuevoTotal = prompt("Editar total a pagar:", r.total);
    if (nuevoTotal === null) return;

    const nuevosKilos = prompt("Editar kilos:", r.kilos);
    if (nuevosKilos === null) return;

    const nuevaFechaEntrega = prompt("Editar fecha de entrega (YYYY-MM-DD):", r.fechaEntrega);
    if (nuevaFechaEntrega === null) return;

    const nuevaHoraEntrega = prompt("Editar hora de entrega (HH:MM):", r.horaEntrega);
    if (nuevaHoraEntrega === null) return;

    const nuevaRopa = prompt("Editar ropa entregada:", r.ropaEntregada);
    if (nuevaRopa === null) return;

    const nuevaSucursal = prompt("Editar sucursal:", r.servicio);
    if (nuevaSucursal === null) return;

    db.ref("recibos/" + clave).update({
      cliente: nuevoCliente,
      total: nuevoTotal,
      kilos: nuevosKilos,
      fechaEntrega: nuevaFechaEntrega,
      horaEntrega: nuevaHoraEntrega,
      ropaEntregada: nuevaRopa,
      servicio: nuevaSucursal
    }).then(mostrarRecibos);
  });
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

function eliminarFiltrados() {
  const desde = document.getElementById("filtroDesde").value;
  const hasta = document.getElementById("filtroHasta").value;
  if (!confirm("¿Seguro que deseas eliminar todos los recibos pagados y gastos filtrados?")) return;

  const desdeFecha = desde ? new Date(desde + "T00:00:00") : null;
  const hastaFecha = hasta ? new Date(hasta + "T23:59:59") : null;

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

window.verRecibo = verRecibo;
window.cerrarModal = () => {
  const m = document.getElementById("modalVerRecibo");
  if (m) {
    m.style.display = "none";
    const cont = document.getElementById("vistaRecibo");
    if (cont) cont.innerHTML = "";
  }
};
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

document.getElementById("filtroDesde").addEventListener("change", mostrarRecibos);
document.getElementById("filtroHasta").addEventListener("change", mostrarRecibos);
window.onload = mostrarRecibos;
