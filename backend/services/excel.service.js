class ExcelService {
  /**
   * Generates a Microsoft Excel XML-compliant workbook buffer from a dataset.
   * @param {Array<Object>} data - Report data records
   * @param {Array<Object>} columns - Column definitions { key, title }
   * @returns {Buffer} Excel workbook buffer
   */
  generateBuffer(data, columns) {
    let headerColsHtml = '';
    columns.forEach(col => {
      headerColsHtml += `<th style="background-color:#10b981; color:#ffffff; font-weight:bold; padding:8px; border:1px solid #cbd5e1;">${col.title}</th>`;
    });

    let rowsHtml = '';
    data.forEach(record => {
      rowsHtml += '<tr>';
      columns.forEach(col => {
        let val = record[col.key];
        if (val === undefined || val === null) val = '';
        if (val instanceof Date) val = val.toLocaleString();
        rowsHtml += `<td style="padding:6px; border:1px solid #cbd5e1;">${String(val).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')}</td>`;
      });
      rowsHtml += '</tr>';
    });

    // Assemble Office XML Worksheet template
    const template = `
      <html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:x="urn:schemas-microsoft-com:office:excel" xmlns="http://www.w3.org/TR/REC-html40">
      <head>
        <meta http-equiv="Content-Type" content="text/html; charset=utf-8">
        <!--[if gte mso 9]>
        <xml>
          <x:ExcelWorkbook>
            <x:ExcelWorksheets>
              <x:ExcelWorksheet>
                <x:Name>HomeoVault Report</x:Name>
                <x:WorksheetOptions>
                  <x:DisplayGridlines/>
                </x:WorksheetOptions>
              </x:ExcelWorksheet>
            </x:ExcelWorksheets>
          </x:ExcelWorkbook>
        </xml>
        <![endif]-->
      </head>
      <body style="font-family:sans-serif;">
        <h2 style="color:#0f172a; margin-bottom:15px;">HomeoVault Ledger Export File</h2>
        <table style="border-collapse:collapse; font-size:10pt;">
          <thead>
            <tr>${headerColsHtml}</tr>
          </thead>
          <tbody>
            ${rowsHtml}
          </tbody>
        </table>
      </body>
      </html>
    `.trim();

    return Buffer.from(template, 'utf-8');
  }
}

export default new ExcelService();
