window.onload = () => {
    document.getElementById("importButton").addEventListener("click", importData);
    document.getElementById("fileInput").addEventListener("change", importFile);
    document.getElementById("sendToAPI").addEventListener("click", sendToAPI);

    
}
let data = [];

importData = async() => {
    try {
        clipboard = await navigator.clipboard.readText();
    } catch (err) {
        console.log(err);
    }
    const rows = clipboard.split("\n");

    // Validación: que todas las filas tengan 12 campos
    for (let i = 0; i < rows.length; i++) {
        const row = rows[i].split("\t");
        if (row.length !== 12) {
            document.getElementById("label-error-excel").style.display = "inline-block";
            return;
        }
        data.push(row)
    }
    
    dataToTable();

}

dataToTable = () => {
    for (let i = 0; i < data.length; i++) {
        document.getElementById("label-error-excel").style.display = "none";

        let tableRow = "<tr>";
        for (let j = 0; j < data[i].length; j++) {
            tableRow += `<td>${data[i][j]}</td>`;
        }
        tableRow += "</tr>";
        document.getElementById("table-body").innerHTML += tableRow;
    }
    
    if (dataTable) {
        console.log("a")
    }
    dataTable = new DataTable("#forsta-table");
    document.getElementById("exportToCSV").addEventListener("click", exportTable);
}

importFile = (event) => {
    const file = event.target.files[0];
    const reader = new FileReader();
    reader.onload = (ev) => {
        const data = new Uint8Array(ev.target.result);
        const workbook = XLSX.read(data, {type: 'array'});
        const worksheet = workbook.Sheets[workbook.SheetNames[0]];
        fileToTable(worksheet);
    }
    reader.readAsArrayBuffer(file);
}

fileToTable = (data) => {
    const obj = Object.keys(data)[8];
    console.log(obj);
    console.log(data);
}

sendToAPI = () => {
    const rows = document.querySelectorAll("#forsta-table tbody tr");
    rows.forEach(row => {
        console.log(`Registrando en API: ${row.innerText}`);
    })

}

exportTable = () => {
    let csv = [];
    const rows = document.querySelectorAll("#forsta-table tbody tr");

    for (let i = 0; i < rows.length; i++) {
        let row = [];
        let cols = rows[i].querySelectorAll("td");

        for (let j = 0; j < cols.length; j++) {
            const cell = cols[j].innerText
            if (cell !== "Send to API") row.push(cell);
        }
        
        csv.push(row.join(","));
    }

    const csvFile = new Blob([csv.join("\n")], {type: "text/csv"});
    
    let dw = document.createElement("a");
    dw.download = `forsta_table.csv`;
    dw.href = window.URL.createObjectURL(csvFile);
    dw.style.display = "none";
    document.body.appendChild(dw);
    dw.click();
    document.body.removeChild(dw);
}