/* =========================================================
   KIA PARTS INVENTORY PORTAL
   Main JavaScript
========================================================= */


/* =========================================================
   GLOBAL DATA
========================================================= */

const SUPABASE_URL = "https://ytuquevimoccpqwbyshi.supabase.co";
const SUPABASE_KEY = "sb_publishable_XaQEAiVnpnCHkr46a_2YzA_NMI9-kAg";

const supabaseClient = window.supabase.createClient(
    SUPABASE_URL,
    SUPABASE_KEY
);

let submissions = [];


/* =========================================================
   INITIALIZATION
========================================================= */

document.addEventListener(
    "DOMContentLoaded",
    async function () {

        document.getElementById(
            "piDate"
        ).value = getToday();

        for (
            let i = 0;
            i < 4;
            i++
        ) {
            addRow();
        }

        updateSummary();

        // LOAD HISTORY FROM SUPABASE
        await loadSubmissionsFromSupabase();

    }
);


/* =========================================================
   TODAY
========================================================= */

function getToday() {

    const d = new Date();

    const year = d.getFullYear();

    const month =
        String(d.getMonth() + 1)
            .padStart(2, "0");

    const day =
        String(d.getDate())
            .padStart(2, "0");

    return `${year}-${month}-${day}`;
}


/* =========================================================
   FORMAT DATE
========================================================= */

function formatDate(dateString) {

    if (!dateString) return "";

    const parts =
        dateString.split("-");

    if (parts.length !== 3)
        return dateString;

    return `${parts[2]}-${parts[1]}-${parts[0]}`;
}


/* =========================================================
   FORMAT MONEY
========================================================= */

function money(value) {

    return "₹" +
        Number(value || 0)
            .toLocaleString("en-IN", {
                maximumFractionDigits: 2
            });

}


/* =========================================================
   NAVIGATION
========================================================= */

function showSection(section) {

    document
        .querySelectorAll(".section")
        .forEach(el =>
            el.classList.remove("active")
        );

    document
        .getElementById(section)
        .classList.add("active");


    document
        .querySelectorAll(".nav button")
        .forEach(el =>
            el.classList.remove("active")
        );


    if (section === "submission") {

        document
            .getElementById("navSubmission")
            .classList.add("active");

    }


    if (section === "dashboard") {

        document
            .getElementById("navDashboard")
            .classList.add("active");

        updateDealerFilter();

        renderDashboard();

    }

}


/* =========================================================
   ADD ROW
========================================================= */

function addRow(data = {}) {

    const tbody =
        document.getElementById("partsBody");

    const row =
        document.createElement("tr");


    row.innerHTML = `

        <td class="row-number"></td>

        <td>
            <input
                class="bin"
                value="${escapeHTML(data.bin || "")}"
                placeholder="Bin/Loc">
        </td>

        <td>
            <input
                class="part-number"
                value="${escapeHTML(data.partNumber || "")}"
                placeholder="Part No">
        </td>

        <td>
            <input
                class="description"
                value="${escapeHTML(data.description || "")}"
                placeholder="Description">
        </td>

        <td>
            <select class="category">

                <option value="Consumable"
                    ${data.category === "Consumable" ? "selected" : ""}>
                    Consumable
                </option>

                <option value="Fast Moving"
                    ${data.category === "Fast Moving" ? "selected" : ""}>
                    Fast Moving
                </option>

                <option value="Slow Moving"
                    ${data.category === "Slow Moving" ? "selected" : ""}>
                    Slow Moving
                </option>

                <option value="Critical"
                    ${data.category === "Critical" ? "selected" : ""}>
                    Critical
                </option>

                <option value="Other"
                    ${data.category === "Other" ? "selected" : ""}>
                    Other
                </option>

            </select>
        </td>

        <td>
            <input
                type="number"
                step="0.01"
                class="mav"
                value="${data.mav || 0}">
        </td>

        <td>
            <input
                type="number"
                class="system-stock"
                value="${data.systemStock || 0}">
        </td>

        <td>
            <input
                type="number"
                class="physical-count"
                value="${data.physicalCount || 0}">
        </td>

        <td>
            <input
                class="variance"
                readonly>
        </td>

        <td>
            <input
                class="variance-value"
                readonly>
        </td>

        <td>
            <input
                class="counted-by"
                value="${escapeHTML(data.countedBy || "")}"
                placeholder="Name">
        </td>

        <td>
            <input
                class="verified-by"
                value="${escapeHTML(data.verifiedBy || "")}"
                placeholder="Name">
        </td>

        <td>
            <input
                class="root-cause"
                value="${escapeHTML(data.rootCause || "")}"
                placeholder="Root Cause">
        </td>

        <td>
            <input
                class="action-taken"
                value="${escapeHTML(data.actionTaken || "")}"
                placeholder="Action Taken">
        </td>

        <td>

            <select class="action-status">

                <option value="OPEN"
                    ${data.actionStatus === "OPEN" ? "selected" : ""}>
                    OPEN
                </option>

                <option value="CLOSED"
                    ${data.actionStatus === "CLOSED" ? "selected" : ""}>
                    CLOSED
                </option>

            </select>

        </td>

        <td>

            <button
                class="btn btn-danger"
                onclick="deleteRow(this)">

                ×

            </button>

        </td>

    `;


    tbody.appendChild(row);


    row
        .querySelectorAll("input, select")
        .forEach(input => {

            input.addEventListener(
                "input",
                updateSummary
            );

            input.addEventListener(
                "change",
                updateSummary
            );

        });


    updateRowNumbers();

    calculateRow(row);

}


/* =========================================================
   ESCAPE HTML
========================================================= */

function escapeHTML(value) {

    return String(value)
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");

}


/* =========================================================
   DELETE ROW
========================================================= */

function deleteRow(button) {

    button
        .closest("tr")
        .remove();

    updateRowNumbers();

    updateSummary();

}


/* =========================================================
   UPDATE ROW NUMBERS
========================================================= */

function updateRowNumbers() {

    document
        .querySelectorAll("#partsBody tr")
        .forEach((row, index) => {

            row
                .querySelector(".row-number")
                .textContent = index + 1;

        });

}


/* =========================================================
   CALCULATE ROW
========================================================= */

function calculateRow(row) {

    const system =
        Number(
            row.querySelector(".system-stock").value
        ) || 0;

    const physical =
        Number(
            row.querySelector(".physical-count").value
        ) || 0;

    const mav =
        Number(
            row.querySelector(".mav").value
        ) || 0;


    const variance =
        system - physical;


    const varianceValue =
        variance * mav;


    row.querySelector(".variance").value =
        variance;


    row.querySelector(".variance-value").value =
        varianceValue.toFixed(2);

}


/* =========================================================
   COLLECT CURRENT FORM DATA
========================================================= */

function collectFormData() {

    const rows = [];

    document
        .querySelectorAll("#partsBody tr")
        .forEach(row => {

            calculateRow(row);

            rows.push({

                bin:
                    row.querySelector(".bin").value,

                partNumber:
                    row.querySelector(".part-number").value,

                description:
                    row.querySelector(".description").value,

                category:
                    row.querySelector(".category").value,

                mav:
                    Number(
                        row.querySelector(".mav").value
                    ) || 0,

                systemStock:
                    Number(
                        row.querySelector(".system-stock").value
                    ) || 0,

                physicalCount:
                    Number(
                        row.querySelector(".physical-count").value
                    ) || 0,

                variance:
                    Number(
                        row.querySelector(".variance").value
                    ) || 0,

                varianceValue:
                    Number(
                        row.querySelector(".variance-value").value
                    ) || 0,

                countedBy:
                    row.querySelector(".counted-by").value,

                verifiedBy:
                    row.querySelector(".verified-by").value,

                rootCause:
                    row.querySelector(".root-cause").value,

                actionTaken:
                    row.querySelector(".action-taken").value,

                actionStatus:
                    row.querySelector(".action-status").value

            });

        });


    return rows;

}


/* =========================================================
   LIVE SUMMARY
========================================================= */

function updateSummary() {

    const rows =
        collectFormData();


    const total =
        rows.length;


    const positive =
        rows.filter(
            r => r.variance < 0
        ).length;


    const negative =
        rows.filter(
            r => r.variance > 0
        ).length;


    const zero =
        rows.filter(
            r => r.variance === 0
        ).length;


    const open =
        rows.filter(
            r => r.actionStatus === "OPEN"
        ).length;


    const closed =
        rows.filter(
            r => r.actionStatus === "CLOSED"
        ).length;


    const net =
        rows.reduce(
            (sum, r) =>
                sum + r.varianceValue,
            0
        );


    const exposure =
        rows.reduce(
            (sum, r) =>
                sum + Math.abs(r.varianceValue),
            0
        );


    const systemTotal =
        rows.reduce(
            (sum, r) =>
                sum + Math.abs(r.systemStock),
            0
        );


    const physicalTotal =
        rows.reduce(
            (sum, r) =>
                sum + Math.abs(r.physicalCount),
            0
        );


    let accuracy = 100;


    if (systemTotal > 0) {

        accuracy =
            100 -
            (
                Math.abs(
                    systemTotal -
                    physicalTotal
                ) / systemTotal
            ) * 100;

    }


    accuracy =
        Math.max(
            0,
            Math.min(
                100,
                accuracy
            )
        );


    document.getElementById(
        "totalLines"
    ).textContent = total;


    document.getElementById(
        "positiveLines"
    ).textContent = positive;


    document.getElementById(
        "negativeLines"
    ).textContent = negative;


    document.getElementById(
        "zeroLines"
    ).textContent = zero;


    document.getElementById(
        "openActions"
    ).textContent = open;


    document.getElementById(
        "closedActions"
    ).textContent = closed;


    document.getElementById(
        "netVariance"
    ).textContent = money(net);


    document.getElementById(
        "absoluteExposure"
    ).textContent = money(exposure);


    document.getElementById(
        "inventoryAccuracy"
    ).textContent =
        accuracy.toFixed(1) + "%";

}


/* =========================================================
   VALIDATE FORM
========================================================= */

function validateForm() {

    const dealerCode =
        document.getElementById(
            "dealerCode"
        ).value.trim();


    const dealerName =
        document.getElementById(
            "dealerName"
        ).value.trim();


    const manager =
        document.getElementById(
            "managerName"
        ).value.trim();


    const piDate =
        document.getElementById(
            "piDate"
        ).value;


    if (!piDate) {

        alert("Please enter PI Date.");

        return false;

    }


    if (!dealerCode) {

        alert("Please enter Dealer Code.");

        return false;

    }


    if (!dealerName) {

        alert("Please enter Dealer Name.");

        return false;

    }


    if (!manager) {

        alert("Please enter Parts Manager Name.");

        return false;

    }


    const rows =
        collectFormData();


    if (rows.length === 0) {

        alert("Please add at least one PI line.");

        return false;

    }


    for (
        let i = 0;
        i < rows.length;
        i++
    ) {

        if (!rows[i].partNumber.trim()) {

            alert(
                "Please enter Part Number in row " +
                (i + 1)
            );

            return false;

        }

    }


    return true;

}


/* =========================================================
   CREATE SUBMISSION
========================================================= */

function createSubmissionObject() {

    const rows =
        collectFormData();


    const submissionDate =
        new Date();


    const id =
        "PI-" +
        Date.now();


    return {

        id: id,

        piDate:
            document.getElementById(
                "piDate"
            ).value,

        submissionDate:
            submissionDate.toISOString(),

        dealerCode:
            document.getElementById(
                "dealerCode"
            ).value.trim(),

        dealerName:
            document.getElementById(
                "dealerName"
            ).value.trim(),

        location:
            document.getElementById(
                "location"
            ).value.trim(),

        managerName:
            document.getElementById(
                "managerName"
            ).value.trim(),

        contactNumber:
            document.getElementById(
                "contactNumber"
            ).value.trim(),

        rows: rows

    };

}


/* =========================================================
   SUBMIT TO HO
========================================================= */

async function submitToHO() {

    if (!validateForm())
        return;

    const submission =
        createSubmissionObject();

    // SAVE SUBMISSION TO SUPABASE
    const { data, error } =
        await supabaseClient
            .from("submissions")
            .insert([
                {
                    id: submission.id,
                    pi_date: submission.piDate,
                    submission_date: submission.submissionDate,
                    dealer_code: submission.dealerCode,
                    dealer_name: submission.dealerName,
                    location: submission.location,
                    manager_name: submission.managerName,
                    contact_number: submission.contactNumber,
                    rows: submission.rows
                }
            ])
            .select();

    // IF SUPABASE GIVES AN ERROR
    if (error) {

        console.error(
            "Supabase error:",
            error
        );

        alert(
            "Submission failed.\n\n" +
            error.message
        );

        return;
    }

    // ADD TO CURRENT PAGE MEMORY
    submissions.push(submission);

    // DOWNLOAD EXCEL
    downloadSubmissionExcel(
        submission
    );

    // REFRESH DASHBOARD
    updateDealerFilter();
    renderDashboard();

    alert(
        "Submission successfully saved to HO database.\n\n" +
        "Excel file has also been downloaded.\n\n" +
        "Submission ID: " +
        submission.id
    );

    clearForm();
}

async function loadSubmissionsFromSupabase() {

    const { data, error } =
        await supabaseClient
            .from("submissions")
            .select("*")
            .order(
                "submission_date",
                {
                    ascending: false
                }
            );

    if (error) {

        console.error(
            "Supabase loading error:",
            error
        );

        alert(
            "Unable to load submission history.\n\n" +
            error.message
        );

        return;
    }

    submissions = data.map(row => ({

        id: row.id,

        piDate: row.pi_date,

        submissionDate:
            row.submission_date,

        dealerCode:
            row.dealer_code,

        dealerName:
            row.dealer_name,

        location:
            row.location,

        managerName:
            row.manager_name,

        contactNumber:
            row.contact_number,

        rows:
            row.rows

    }));

    updateDealerFilter();

    renderDashboard();
}


/* =========================================================
   CREATE EXCEL WORKBOOK
========================================================= */

function createWorkbook(submission) {

    const excelRows = [];


    submission.rows.forEach(
        (r, index) => {

            excelRows.push({

                "PI Date":
                    formatDate(
                        submission.piDate
                    ),

                "Dealer Code":
                    submission.dealerCode,

                "Dealer Name":
                    submission.dealerName,

                "Location / City":
                    submission.location,

                "Parts Manager":
                    submission.managerName,

                "Contact Number":
                    submission.contactNumber,

                "Sr. No.":
                    index + 1,

                "Location/Bin":
                    r.bin,

                "Part Number":
                    r.partNumber,

                "Part Description":
                    r.description,

                "Part Category":
                    r.category,

                "Part MAV":
                    r.mav,

                "System Stock Qty":
                    r.systemStock,

                "Physical Count Qty":
                    r.physicalCount,

                "Variance Qty":
                    r.variance,

                "Variance Value":
                    r.varianceValue,

                "Counted By":
                    r.countedBy,

                "Verified By":
                    r.verifiedBy,

                "Root Cause":
                    r.rootCause,

                "Action Taken":
                    r.actionTaken,

                "Action Status":
                    r.actionStatus

            });

        }
    );


    /*
       SUMMARY SHEET
    */

    const summary =
        calculateSubmissionSummary(
            submission
        );


    const summaryRows = [

        {
            "Metric":
                "Total PI Records",
            "Value":
                summary.total
        },

        {
            "Metric":
                "Total Variance Lines",
            "Value":
                summary.varianceLines
        },

        {
            "Metric":
                "Positive Variance Lines",
            "Value":
                summary.positive
        },

        {
            "Metric":
                "Negative Variance Lines",
            "Value":
                summary.negative
        },

        {
            "Metric":
                "Zero Variance Lines",
            "Value":
                summary.zero
        },

        {
            "Metric":
                "Open Actions",
            "Value":
                summary.open
        },

        {
            "Metric":
                "Closed Actions",
            "Value":
                summary.closed
        },

        {
            "Metric":
                "Net Variance Value",
            "Value":
                summary.net
        },

        {
            "Metric":
                "Absolute Exposure",
            "Value":
                summary.exposure
        },

        {
            "Metric":
                "Inventory Accuracy",
            "Value":
                summary.accuracy + "%"
        }

    ];


    const workbook =
        XLSX.utils.book_new();


    const dataSheet =
        XLSX.utils.json_to_sheet(
            excelRows
        );


    const summarySheet =
        XLSX.utils.json_to_sheet(
            summaryRows
        );


    XLSX.utils.book_append_sheet(
        workbook,
        dataSheet,
        "PI Data"
    );


    XLSX.utils.book_append_sheet(
        workbook,
        summarySheet,
        "Summary"
    );


    return workbook;

}


/* =========================================================
   DOWNLOAD EXCEL
========================================================= */

function downloadSubmissionExcel(
    submission
) {

    const workbook =
        createWorkbook(
            submission
        );


    const date =
        formatDate(
            submission.piDate
        );


    const fileName =
        submission.dealerCode +
        "_" +
        date +
        "_PIdata.xlsx";


    /*
       THIS IS THE IMPORTANT FIX.

       XLSX.writeFile directly triggers
       the browser download.
    */

    XLSX.writeFile(
        workbook,
        fileName
    );

}


/* =========================================================
   DOWNLOAD CURRENT EXCEL
========================================================= */

function downloadCurrentExcel() {

    if (!validateForm())
        return;


    const submission =
        createSubmissionObject();


    downloadSubmissionExcel(
        submission
    );

}


/* =========================================================
   CALCULATE SUBMISSION SUMMARY
========================================================= */

function calculateSubmissionSummary(
    submission
) {

    const rows =
        submission.rows;


    const total =
        rows.length;


    const varianceLines =
        rows.filter(
            r => r.variance !== 0
        ).length;


    const positive =
        rows.filter(
            r => r.variance < 0
        ).length;


    const negative =
        rows.filter(
            r => r.variance > 0
        ).length;


    const zero =
        rows.filter(
            r => r.variance === 0
        ).length;


    const open =
        rows.filter(
            r => r.actionStatus === "OPEN"
        ).length;


    const closed =
        rows.filter(
            r => r.actionStatus === "CLOSED"
        ).length;


    const net =
        rows.reduce(
            (sum, r) =>
                sum + r.varianceValue,
            0
        );


    const exposure =
        rows.reduce(
            (sum, r) =>
                sum + Math.abs(r.varianceValue),
            0
        );


    const systemTotal =
        rows.reduce(
            (sum, r) =>
                sum + Math.abs(r.systemStock),
            0
        );


    const physicalTotal =
        rows.reduce(
            (sum, r) =>
                sum + Math.abs(r.physicalCount),
            0
        );


    let accuracy = 100;


    if (systemTotal > 0) {

        accuracy =
            100 -
            (
                Math.abs(
                    systemTotal -
                    physicalTotal
                ) / systemTotal
            ) * 100;

    }


    accuracy =
        Math.max(
            0,
            Math.min(
                100,
                accuracy
            )
        );


    return {

        total,
        varianceLines,
        positive,
        negative,
        zero,
        open,
        closed,
        net,
        exposure,
        accuracy:
            accuracy.toFixed(1)

    };

}


/* =========================================================
   IMPORT EXCEL
========================================================= */

function importExcel() {

    const fileInput =
        document.getElementById(
            "excelUpload"
        );


    const file =
        fileInput.files[0];


    if (!file) {

        alert(
            "Please select an Excel file first."
        );

        return;

    }


    const reader =
        new FileReader();


    reader.onload =
        function(event) {

            try {

                const workbook =
                    XLSX.read(
                        event.target.result,
                        {
                            type: "array"
                        }
                    );


                const firstSheet =
                    workbook.Sheets[
                        workbook.SheetNames[0]
                    ];


                const data =
                    XLSX.utils.sheet_to_json(
                        firstSheet,
                        {
                            defval: ""
                        }
                    );


                if (!data.length) {

                    alert(
                        "Excel file contains no data."
                    );

                    return;

                }


                /*
                   Automatically read dealer
                   information if available.
                */

                const first =
                    data[0];


                if (
                    first["Dealer Code"] ||
                    first["DealerCode"]
                ) {

                    document.getElementById(
                        "dealerCode"
                    ).value =
                        first["Dealer Code"] ||
                        first["DealerCode"];

                }


                if (first["Dealer Name"]) {

                    document.getElementById(
                        "dealerName"
                    ).value =
                        first["Dealer Name"];

                }


                if (
                    first["Location / City"] ||
                    first["Location"]
                ) {

                    document.getElementById(
                        "location"
                    ).value =
                        first["Location / City"] ||
                        first["Location"];

                }


                /*
                   Remove current rows
                */

                document.getElementById(
                    "partsBody"
                ).innerHTML = "";


                data.forEach(
                    row => {

                        addRow({

                            bin:
                                row["Location/Bin"] ||
                                row["Bin/Loc"] ||
                                "",

                            partNumber:
                                row["Part Number"] ||
                                "",

                            description:
                                row["Part Description"] ||
                                row["Description"] ||
                                "",

                            category:
                                row["Part Category"] ||
                                row["Category"] ||
                                "Consumable",

                            mav:
                                row["Part MAV"] ||
                                row["MAV"] ||
                                0,

                            systemStock:
                                row["System Stock Qty"] ||
                                row["System Stock"] ||
                                0,

                            physicalCount:
                                row["Physical Count Qty"] ||
                                row["Physical Count"] ||
                                0,

                            countedBy:
                                row["Counted By"] ||
                                "",

                            verifiedBy:
                                row["Verified By"] ||
                                "",

                            rootCause:
                                row["Root Cause"] ||
                                "",

                            actionTaken:
                                row["Action Taken"] ||
                                "",

                            actionStatus:
                                row["Action Status"] ||
                                "OPEN"

                        });

                    }
                );


                updateSummary();


                alert(
                    data.length +
                    " Excel rows imported successfully."
                );

            }
            catch(error) {

                console.error(error);

                alert(
                    "Unable to read the Excel file.\n\n" +
                    "Please check the file format."
                );

            }

        };


    reader.readAsArrayBuffer(file);

}


/* =========================================================
   UPDATE DEALER FILTER
========================================================= */

function updateDealerFilter() {

    const select =
        document.getElementById(
            "filterDealer"
        );


    if (!select)
        return;


    const current =
        select.value;


    const dealers =
        [
            ...new Set(
                submissions.map(
                    s => s.dealerCode
                )
            )
        ].sort();


    select.innerHTML =
        `<option value="">
            All Dealers
        </option>`;


    dealers.forEach(
        dealer => {

            const option =
                document.createElement(
                    "option"
                );

            option.value =
                dealer;

            option.textContent =
                dealer;

            select.appendChild(
                option
            );

        }
    );


    select.value =
        current;

}


/* =========================================================
   RENDER HO DASHBOARD
========================================================= */

function renderDashboard() {

    const dealer =
        document.getElementById(
            "filterDealer"
        )?.value || "";


    const dealerName =
        document.getElementById(
            "filterDealerName"
        )?.value
        .toLowerCase()
        .trim() || "";


    const date =
        document.getElementById(
            "filterDate"
        )?.value || "";


    const status =
        document.getElementById(
            "filterStatus"
        )?.value || "";


    const search =
        document.getElementById(
            "filterSearch"
        )?.value
        .toLowerCase()
        .trim() || "";


    const filtered =
        submissions.filter(
            submission => {

                if (
                    dealer &&
                    submission.dealerCode !== dealer
                ) {

                    return false;

                }


                if (
                    dealerName &&
                    !submission.dealerName
                        .toLowerCase()
                        .includes(dealerName)
                ) {

                    return false;

                }


                if (
                    date &&
                    submission.piDate !== date
                ) {

                    return false;

                }


                const rows =
                    submission.rows;


                if (status) {

                    const hasStatus =
                        rows.some(
                            r =>
                                r.actionStatus === status
                        );

                    if (!hasStatus)
                        return false;

                }


                if (search) {

                    const found =
                        rows.some(
                            r =>

                                r.partNumber
                                    .toLowerCase()
                                    .includes(search)

                                ||

                                r.description
                                    .toLowerCase()
                                    .includes(search)

                                ||

                                r.rootCause
                                    .toLowerCase()
                                    .includes(search)

                        );


                    if (!found)
                        return false;

                }


                return true;

            }
        );


    renderDashboardTable(
        filtered
    );


    updateDashboardKPIs(
        filtered
    );

}


/* =========================================================
   RENDER DASHBOARD TABLE
========================================================= */

function renderDashboardTable(
    data
) {

    const tbody =
        document.getElementById(
            "dashboardBody"
        );


    tbody.innerHTML = "";


    if (!data.length) {

        tbody.innerHTML = `

            <tr>

                <td
                    colspan="14"
                    style="text-align:center;padding:30px;">

                    No submissions found.

                </td>

            </tr>

        `;

        return;

    }


    /*
       Latest submissions first
    */

    const sorted =
        [...data].sort(
            (a, b) =>
                new Date(b.submissionDate) -
                new Date(a.submissionDate)
        );


    sorted.forEach(
        submission => {

            const summary =
                calculateSubmissionSummary(
                    submission
                );


            const tr =
                document.createElement("tr");


            tr.innerHTML = `

                <td>
                    ${submission.id}
                </td>

                <td>
                    ${formatDate(submission.piDate)}
                </td>

                <td>
                    ${formatSubmissionDate(
                        submission.submissionDate
                    )}
                </td>

                <td>
                    <strong>
                        ${escapeHTML(
                            submission.dealerCode
                        )}
                    </strong>
                </td>

                <td>
                    ${escapeHTML(
                        submission.dealerName
                    )}
                </td>

                <td>
                    ${escapeHTML(
                        submission.location
                    )}
                </td>

                <td>
                    ${escapeHTML(
                        submission.managerName
                    )}
                </td>

                <td>
                    ${summary.total}
                </td>

                <td class="green">
                    ${summary.positive}
                </td>

                <td class="red">
                    ${summary.negative}
                </td>

                <td class="orange">
                    ${summary.open}
                </td>

                <td>
                    ${money(summary.net)}
                </td>

                <td>

                    <span class="status status-submitted">
                        SUBMITTED
                    </span>

                </td>

                <td>

                    <button
                        class="btn btn-dark"
                        onclick="viewSubmission('${submission.id}')">

                        View

                    </button>

                    <button
                        class="btn btn-secondary"
                        onclick="downloadStoredSubmission('${submission.id}')">

                        Excel

                    </button>

                </td>

            `;


            tbody.appendChild(
                tr
            );

        }
    );

}


/* =========================================================
   FORMAT SUBMISSION DATE
========================================================= */

function formatSubmissionDate(
    iso
) {

    const d =
        new Date(iso);


    const date =
        d.toLocaleDateString(
            "en-IN"
        );


    const time =
        d.toLocaleTimeString(
            "en-IN",
            {
                hour: "2-digit",
                minute: "2-digit"
            }
        );


    return date + " " + time;

}


/* =========================================================
   UPDATE DASHBOARD KPIs
========================================================= */

function updateDashboardKPIs(
    data
) {

    let totalLines = 0;

    let negative = 0;

    let positive = 0;

    let open = 0;

    let exposure = 0;


    data.forEach(
        submission => {

            const summary =
                calculateSubmissionSummary(
                    submission
                );


            totalLines +=
                summary.total;

            negative +=
                summary.negative;

            positive +=
                summary.positive;

            open +=
                summary.open;

            exposure +=
                summary.exposure;

        }
    );


    document.getElementById(
        "dashTotalSubmissions"
    ).textContent =
        data.length;


    document.getElementById(
        "dashTotalLines"
    ).textContent =
        totalLines;


    document.getElementById(
        "dashNegative"
    ).textContent =
        negative;


    document.getElementById(
        "dashPositive"
    ).textContent =
        positive;


    document.getElementById(
        "dashOpen"
    ).textContent =
        open;


    document.getElementById(
        "dashExposure"
    ).textContent =
        money(exposure);

}


/* =========================================================
   VIEW SUBMISSION
========================================================= */

function viewSubmission(
    id
) {

    const submission =
        submissions.find(
            s => s.id === id
        );


    if (!submission)
        return;


    const summary =
        calculateSubmissionSummary(
            submission
        );


    let html = `

        <h3>
            ${escapeHTML(
                submission.dealerName
            )}
        </h3>

        <p>
            <strong>Dealer Code:</strong>
            ${escapeHTML(
                submission.dealerCode
            )}
        </p>

        <p>
            <strong>PI Date:</strong>
            ${formatDate(
                submission.piDate
            )}
        </p>

        <p>
            <strong>Parts Manager:</strong>
            ${escapeHTML(
                submission.managerName
            )}
        </p>

        <hr>

        <div class="summary-grid">

            <div class="summary-card">
                <div class="summary-number">
                    ${summary.total}
                </div>
                <div class="summary-label">
                    Total Lines
                </div>
            </div>

            <div class="summary-card">
                <div class="summary-number green">
                    ${summary.positive}
                </div>
                <div class="summary-label">
                    Positive
                </div>
            </div>

            <div class="summary-card">
                <div class="summary-number red">
                    ${summary.negative}
                </div>
                <div class="summary-label">
                    Negative
                </div>
            </div>

            <div class="summary-card">
                <div class="summary-number orange">
                    ${summary.open}
                </div>
                <div class="summary-label">
                    Open Actions
                </div>
            </div>

            <div class="summary-card">
                <div class="summary-number">
                    ${money(summary.net)}
                </div>
                <div class="summary-label">
                    Net Variance
                </div>
            </div>

            <div class="summary-card">
                <div class="summary-number red">
                    ${money(summary.exposure)}
                </div>
                <div class="summary-label">
                    Absolute Exposure
                </div>
            </div>

        </div>

        <br>

        <div class="table-container">

            <table>

                <thead>

                    <tr>

                        <th>#</th>
                        <th>Bin</th>
                        <th>Part Number</th>
                        <th>Description</th>
                        <th>Category</th>
                        <th>MAV</th>
                        <th>System Qty</th>
                        <th>Physical Qty</th>
                        <th>Variance</th>
                        <th>Variance Value</th>
                        <th>Root Cause</th>
                        <th>Action</th>
                        <th>Status</th>

                    </tr>

                </thead>

                <tbody>
    `;


    submission.rows.forEach(
        (r, index) => {

            html += `

                <tr>

                    <td>
                        ${index + 1}
                    </td>

                    <td>
                        ${escapeHTML(r.bin)}
                    </td>

                    <td>
                        ${escapeHTML(r.partNumber)}
                    </td>

                    <td>
                        ${escapeHTML(r.description)}
                    </td>

                    <td>
                        ${escapeHTML(r.category)}
                    </td>

                    <td>
                        ${money(r.mav)}
                    </td>

                    <td>
                        ${r.systemStock}
                    </td>

                    <td>
                        ${r.physicalCount}
                    </td>

                    <td>
                        ${r.variance}
                    </td>

                    <td>
                        ${money(r.varianceValue)}
                    </td>

                    <td>
                        ${escapeHTML(r.rootCause)}
                    </td>

                    <td>
                        ${escapeHTML(r.actionTaken)}
                    </td>

                    <td>

                        <span
                            class="status ${
                                r.actionStatus === "OPEN"
                                    ? "status-open"
                                    : "status-closed"
                            }">

                            ${r.actionStatus}

                        </span>

                    </td>

                </tr>

            `;

        }
    );


    html += `

                </tbody>

            </table>

        </div>

        <br>

        <button
            class="btn btn-dark"
            onclick="downloadStoredSubmission('${submission.id}')">

            Download Excel

        </button>

    `;


    document.getElementById(
        "modalBody"
    ).innerHTML = html;


    document.getElementById(
        "submissionModal"
    ).style.display = "block";

}


/* =========================================================
   CLOSE MODAL
========================================================= */

function closeModal() {

    document.getElementById(
        "submissionModal"
    ).style.display = "none";

}


/* =========================================================
   DOWNLOAD STORED SUBMISSION
========================================================= */

function downloadStoredSubmission(
    id
) {

    const submission =
        submissions.find(
            s => s.id === id
        );


    if (!submission) {

        alert(
            "Submission not found."
        );

        return;

    }


    downloadSubmissionExcel(
        submission
    );

}


/* =========================================================
   RESET FILTERS
========================================================= */

function resetFilters() {

    document.getElementById(
        "filterDealer"
    ).value = "";


    document.getElementById(
        "filterDealerName"
    ).value = "";


    document.getElementById(
        "filterDate"
    ).value = "";


    document.getElementById(
        "filterStatus"
    ).value = "";


    document.getElementById(
        "filterSearch"
    ).value = "";


    renderDashboard();

}


/* =========================================================
   EXPORT FILTERED DASHBOARD
========================================================= */

function exportFilteredDashboard() {

    const dealer =
        document.getElementById(
            "filterDealer"
        ).value;


    const dealerName =
        document.getElementById(
            "filterDealerName"
        ).value
        .toLowerCase()
        .trim();


    const date =
        document.getElementById(
            "filterDate"
        ).value;


    const status =
        document.getElementById(
            "filterStatus"
        ).value;


    const search =
        document.getElementById(
            "filterSearch"
        ).value
        .toLowerCase()
        .trim();


    const result = [];


    submissions.forEach(
        submission => {

            if (
                dealer &&
                submission.dealerCode !== dealer
            )
                return;


            if (
                dealerName &&
                !submission.dealerName
                    .toLowerCase()
                    .includes(dealerName)
            )
                return;


            if (
                date &&
                submission.piDate !== date
            )
                return;


            submission.rows.forEach(
                row => {

                    if (
                        status &&
                        row.actionStatus !== status
                    )
                        return;


                    if (
                        search &&
                        !(
                            row.partNumber
                                .toLowerCase()
                                .includes(search)

                            ||

                            row.description
                                .toLowerCase()
                                .includes(search)

                            ||

                            row.rootCause
                                .toLowerCase()
                                .includes(search)
                        )
                    )
                        return;


                    result.push({

                        "PI Date":
                            formatDate(
                                submission.piDate
                            ),

                        "Submission Date":
                            formatSubmissionDate(
                                submission.submissionDate
                            ),

                        "Dealer Code":
                            submission.dealerCode,

                        "Dealer Name":
                            submission.dealerName,

                        "Location":
                            submission.location,

                        "Parts Manager":
                            submission.managerName,

                        "Part Number":
                            row.partNumber,

                        "Description":
                            row.description,

                        "Category":
                            row.category,

                        "MAV":
                            row.mav,

                        "System Stock":
                            row.systemStock,

                        "Physical Count":
                            row.physicalCount,

                        "Variance":
                            row.variance,

                        "Variance Value":
                            row.varianceValue,

                        "Root Cause":
                            row.rootCause,

                        "Action Taken":
                            row.actionTaken,

                        "Action Status":
                            row.actionStatus

                    });

                }
            );

        }
    );


    if (!result.length) {

        alert(
            "No data available for the selected filters."
        );

        return;

    }


    const workbook =
        XLSX.utils.book_new();


    const sheet =
        XLSX.utils.json_to_sheet(
            result
        );


    XLSX.utils.book_append_sheet(
        workbook,
        sheet,
        "HO Dashboard"
    );


    XLSX.writeFile(
        workbook,
        "KIA_HO_Filtered_PI_Data.xlsx"
    );

}


/* =========================================================
   CLEAR ROWS
========================================================= */

function clearRows() {

    document.getElementById(
        "partsBody"
    ).innerHTML = "";


    updateSummary();

}


/* =========================================================
   CLEAR COMPLETE FORM
========================================================= */

function clearForm() {

    if (
        !confirm(
            "Clear the current form?"
        )
    )
        return;


    document.getElementById(
        "dealerCode"
    ).value = "";


    document.getElementById(
        "dealerName"
    ).value = "";


    document.getElementById(
        "location"
    ).value = "";


    document.getElementById(
        "managerName"
    ).value = "";


    document.getElementById(
        "contactNumber"
    ).value = "";


    document.getElementById(
        "excelUpload"
    ).value = "";


    document.getElementById(
        "partsBody"
    ).innerHTML = "";


    for (let i = 0; i < 4; i++) {

        addRow();

    }


    document.getElementById(
        "piDate"
    ).value =
        getToday();


    updateSummary();

}


/* =========================================================
   CLOSE MODAL WHEN CLICKING OUTSIDE
========================================================= */

window.onclick =
    function(event) {

        const modal =
            document.getElementById(
                "submissionModal"
            );


        if (event.target === modal) {

            modal.style.display = "none";

        }

    };


/* =========================================================
   TEST DATA
   Remove this section before production
========================================================= */

/*
   To test the HO Dashboard quickly,
   open browser console and run:

   createDemoData()

*/

function createDemoData() {

    const demo = {

        id: "PI-DEMO-001",

        piDate: "2026-09-01",

        submissionDate:
            new Date().toISOString(),

        dealerCode: "2323",

        dealerName:
            "Kia Premium Pune",

        location: "Pune",

        managerName:
            "Aman Sharma",

        contactNumber:
            "9876543210",

        rows: [

            {
                bin: "123",
                partNumber: "3",
                description: "Demo Part 3",
                category: "Consumable",
                mav: 100,
                systemStock: 10,
                physicalCount: 7,
                variance: 3,
                varianceValue: 300,
                countedBy: "Aman",
                verifiedBy: "Ram",
                rootCause: "Counting error",
                actionTaken: "Recount",
                actionStatus: "OPEN"
            },

            {
                bin: "123",
                partNumber: "4",
                description: "Demo Part 4",
                category: "Consumable",
                mav: 100,
                systemStock: 10,
                physicalCount: 6,
                variance: 4,
                varianceValue: 400,
                countedBy: "Aman",
                verifiedBy: "Ram",
                rootCause: "System mismatch",
                actionTaken: "Adjustment",
                actionStatus: "OPEN"
            },

            {
                bin: "123",
                partNumber: "5",
                description: "Demo Part 5",
                category: "Consumable",
                mav: 100,
                systemStock: 10,
                physicalCount: 8,
                variance: 2,
                varianceValue: 200,
                countedBy: "Aman",
                verifiedBy: "Ram",
                rootCause: "Transfer",
                actionTaken: "Updated",
                actionStatus: "CLOSED"
            },

            {
                bin: "123",
                partNumber: "6",
                description: "Demo Part 6",
                category: "Consumable",
                mav: 100,
                systemStock: 10,
                physicalCount: 12,
                variance: -2,
                varianceValue: -200,
                countedBy: "Aman",
                verifiedBy: "Ram",
                rootCause: "Extra stock",
                actionTaken: "Verified",
                actionStatus: "CLOSED"
            }

        ]

    };


    submissions.push(
        demo
    );


    localStorage.setItem(
        "kiaPI_submissions",
        JSON.stringify(submissions)
    );


    updateDealerFilter();

    renderDashboard();


    alert(
        "Demo submission added."
    );

}
