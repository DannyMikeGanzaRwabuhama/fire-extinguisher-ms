const { Parser } = require('json2csv');
const PDFDocument = require('pdfkit');
const db = require('../../config/db');

// Map extinguisher fields
const mapExtinguisher = (row) => ({
  id: row.id,
  serialNumber: row.serial_number,
  location: row.location,
  type: row.type,
  size: row.size,
  installationDate: row.installation_date,
  expiryDate: row.expiry_date,
  status: row.status,
});

// Map inspection fields
const mapInspection = (row) => ({
  id: row.id,
  userId: row.user_id,
  userName: row.user_name,
  extinguisherId: row.extinguisher_id,
  serialNumber: row.serial_number,
  location: row.location,
  inspectionDate: row.inspection_date,
  inspectionTime: row.inspection_time,
  status: row.status,
});

// Map maintenance fields
const mapMaintenance = (row) => ({
  id: row.id,
  maintenanceDate: row.maintenance_date,
  extinguisherId: row.extinguisher_id,
  serialNumber: row.serial_number,
  location: row.location,
  inspectorName: row.inspector_name,
  actions: row.actions,
  conditionsNoted: row.conditions_noted,
});

const generateCsvResponse = (res, filename, fields, data) => {
  try {
    const parser = new Parser({ fields });
    const csv = parser.parse(data);
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}.csv"`);
    return res.status(200).send(csv);
  } catch (error) {
    return res.status(500).json({
      status: 500,
      message: 'CSV generation error: ' + error.message,
      timestamp: new Date().toISOString(),
    });
  }
};

const generatePdfResponse = (res, title, headers, keys, rows, customColWidths = null) => {
  const doc = new PDFDocument({ margin: 50, bufferPages: true });
  res.setHeader('Content-Type', 'application/pdf');
  res.setHeader('Content-Disposition', `attachment; filename="${title.toLowerCase().replace(/\s+/g, '_')}.pdf"`);
  doc.pipe(res);

  // Crimson & Slate Theme Colors
  const PRIMARY_COLOR = '#991b1b'; // Deep Crimson
  const TEXT_COLOR = '#0f172a'; // Dark Slate
  const MUTED_COLOR = '#64748b'; // Gray
  const HEADER_BG = '#334155'; // Slate background for headers
  const ROW_ALT_BG = '#f8fafc'; // Light gray alternating background
  const BORDER_COLOR = '#e2e8f0'; // Light border gray

  // 1. BRAND HEADER BANNER (Only on page 1)
  doc.rect(50, 45, 512, 60).fill(PRIMARY_COLOR);
  
  // Brand name and system title inside banner
  doc.fillColor('#ffffff').font('Helvetica-Bold').fontSize(18).text('TZW LTD', 65, 55);
  doc.font('Helvetica').fontSize(10).fillColor('#f8fafc').text('Fire Extinguisher Management System', 65, 80);
  
  // Right-aligned report title & timestamp inside banner
  doc.fillColor('#ffffff').font('Helvetica-Bold').fontSize(11).text(title, 300, 58, { align: 'right', width: 245 });
  doc.font('Helvetica-Oblique').fontSize(8).fillColor('#f1f5f9').text(`Generated: ${new Date().toLocaleString()}`, 300, 80, { align: 'right', width: 245 });

  const startX = 50;
  let startY = 130;

  // Compute column widths
  const colWidths = customColWidths || headers.map(() => 512 / headers.length);

  const getColOffset = (index) => {
    return colWidths.slice(0, index).reduce((sum, w) => sum + w, 0);
  };

  const drawHeader = (doc, y) => {
    doc.rect(startX, y - 4, 512, 20).fill(HEADER_BG);
    doc.fillColor('#ffffff').font('Helvetica-Bold').fontSize(9);
    
    headers.forEach((h, i) => {
      doc.text(h, startX + getColOffset(i), y, { width: colWidths[i] - 5 });
    });
    
    return y + 20;
  };

  // Draw initial header
  startY = drawHeader(doc, startY);

  rows.forEach((row, rowIndex) => {
    // 2. CALCULATE ROW HEIGHT DYNAMICALLY
    let maxRowHeight = 15; // Minimum row height
    keys.forEach((k, i) => {
      let val = row[k];
      if (val instanceof Date) {
        val = val.toISOString().split('T')[0];
      } else if (val === null || val === undefined) {
        val = 'N/A';
      } else {
        val = String(val);
      }
      doc.font('Helvetica').fontSize(8);
      const cellHeight = doc.heightOfString(val, { width: colWidths[i] - 5 });
      if (cellHeight > maxRowHeight) {
        maxRowHeight = cellHeight;
      }
    });

    // Page overflow check (margin bottom is 50, page height is 792, so limit is ~720)
    if (startY + maxRowHeight > 720) {
      doc.addPage();
      startY = 50;
      startY = drawHeader(doc, startY);
    }

    // 3. ALTERNATING ROW BACKGROUND (Zebra striping)
    if (rowIndex % 2 === 1) {
      doc.rect(startX, startY - 4, 512, maxRowHeight + 8).fill(ROW_ALT_BG);
    }

    // Draw cells
    doc.fillColor(TEXT_COLOR).font('Helvetica').fontSize(8);
    keys.forEach((k, i) => {
      let val = row[k];
      if (val instanceof Date) {
        val = val.toISOString().split('T')[0];
      } else if (val === null || val === undefined) {
        val = 'N/A';
      } else {
        val = String(val);
      }
      doc.text(val, startX + getColOffset(i), startY, { width: colWidths[i] - 5 });
    });

    // 4. THIN BORDER BELOW ROW
    doc.moveTo(startX, startY + maxRowHeight + 4)
       .lineTo(startX + 512, startY + maxRowHeight + 4)
       .strokeColor(BORDER_COLOR)
       .lineWidth(0.5)
       .stroke();

    startY += maxRowHeight + 8;
  });

  // 5. GLOBAL PAGE NUMBERS & FOOTER
  const range = doc.bufferedPageRange();
  for (let i = 0; i < range.count; i++) {
    doc.switchToPage(i);
    
    doc.moveTo(50, doc.page.height - 40)
       .lineTo(doc.page.width - 50, doc.page.height - 40)
       .strokeColor(BORDER_COLOR)
       .lineWidth(0.5)
       .stroke();

    doc.font('Helvetica').fontSize(8).fillColor(MUTED_COLOR);
    doc.text(
      `Page ${i + 1} of ${range.count}`,
      50,
      doc.page.height - 32,
      { align: 'center', width: doc.page.width - 100 }
    );
  }

  doc.end();
};

const getStockReport = async (req, res, next) => {
  const format = req.query.format || 'json';
  const period = req.query.period || 'monthly';
  const dateStr = req.query.date || new Date().toISOString().split('T')[0];

  try {
    let sqlFilter = '';
    if (period === 'daily') {
      sqlFilter = 'WHERE installation_date = $1';
    } else if (period === 'monthly') {
      sqlFilter = "WHERE DATE_TRUNC('month', installation_date) = DATE_TRUNC('month', $1::date)";
    } else if (period === 'yearly') {
      sqlFilter = "WHERE DATE_TRUNC('year', installation_date) = DATE_TRUNC('year', $1::date)";
    }

    if (format === 'json') {
      const page = parseInt(req.query.page) || 1;
      const limit = parseInt(req.query.limit) || 10;
      const offset = (page - 1) * limit;

      const countRes = await db.query(`SELECT COUNT(*) FROM extinguishers ${sqlFilter}`, [dateStr]);
      const total = parseInt(countRes.rows[0].count);

      const dataRes = await db.query(
        `SELECT * FROM extinguishers ${sqlFilter} ORDER BY id DESC LIMIT $2 OFFSET $3`,
        [dateStr, limit, offset]
      );

      const totalPages = Math.ceil(total / limit);
      res.status(200).json({
        data: dataRes.rows.map(mapExtinguisher),
        total,
        page,
        limit,
        totalPages,
      });
    } else {
      const dataRes = await db.query(`SELECT * FROM extinguishers ${sqlFilter} ORDER BY id DESC`, [dateStr]);
      const mapped = dataRes.rows.map(mapExtinguisher);

      if (format === 'csv') {
        const fields = ['id', 'serialNumber', 'location', 'type', 'size', 'installationDate', 'expiryDate', 'status'];
        generateCsvResponse(res, `stock_${period}_report`, fields, mapped);
      } else {
        const headers = ['ID', 'Serial Number', 'Location', 'Type', 'Size', 'Install Date', 'Expiry Date', 'Status'];
        const keys = ['id', 'serialNumber', 'location', 'type', 'size', 'installationDate', 'expiryDate', 'status'];
        const colWidths = [25, 80, 117, 50, 40, 70, 70, 60];
        generatePdfResponse(res, `Extinguishers Stock (${period.toUpperCase()})`, headers, keys, mapped, colWidths);
      }
    }
  } catch (error) {
    next(error);
  }
};

const getInspectionStatusReport = async (req, res, next) => {
  const format = req.query.format || 'json';
  const status = req.query.status;
  const from = req.query.from;
  const to = req.query.to;

  try {
    let sqlFilter = 'WHERE 1=1';
    const params = [];

    if (status) {
      params.push(status);
      sqlFilter += ` AND i.status = $${params.length}`;
    }
    if (from) {
      params.push(from);
      sqlFilter += ` AND i.inspection_date >= $${params.length}`;
    }
    if (to) {
      params.push(to);
      sqlFilter += ` AND i.inspection_date <= $${params.length}`;
    }

    if (format === 'json') {
      const page = parseInt(req.query.page) || 1;
      const limit = parseInt(req.query.limit) || 10;
      const offset = (page - 1) * limit;

      const countRes = await db.query(
        `SELECT COUNT(*) FROM inspections i ${sqlFilter}`,
        params
      );
      const total = parseInt(countRes.rows[0].count);

      const queryParams = [...params, limit, offset];
      const dataRes = await db.query(
        `SELECT i.*, e.serial_number, e.location, u.first_name || ' ' || u.last_name AS user_name
         FROM inspections i
         LEFT JOIN extinguishers e ON i.extinguisher_id = e.id
         LEFT JOIN users u ON i.user_id = u.id
         ${sqlFilter}
         ORDER BY i.id DESC
         LIMIT $${queryParams.length - 1} OFFSET $${queryParams.length}`,
        queryParams
      );

      const totalPages = Math.ceil(total / limit);
      res.status(200).json({
        data: dataRes.rows.map(mapInspection),
        total,
        page,
        limit,
        totalPages,
      });
    } else {
      const dataRes = await db.query(
        `SELECT i.*, e.serial_number, e.location, u.first_name || ' ' || u.last_name AS user_name
         FROM inspections i
         LEFT JOIN extinguishers e ON i.extinguisher_id = e.id
         LEFT JOIN users u ON i.user_id = u.id
         ${sqlFilter}
         ORDER BY i.id DESC`,
        params
      );
      const mapped = dataRes.rows.map(mapInspection);

      if (format === 'csv') {
        const fields = ['id', 'userName', 'serialNumber', 'location', 'inspectionDate', 'inspectionTime', 'status'];
        generateCsvResponse(res, 'inspection_status_report', fields, mapped);
      } else {
        const headers = ['ID', 'User', 'Serial Number', 'Location', 'Date', 'Time', 'Status'];
        const keys = ['id', 'userName', 'serialNumber', 'location', 'inspectionDate', 'inspectionTime', 'status'];
        const colWidths = [25, 100, 80, 127, 60, 50, 70];
        generatePdfResponse(res, 'Inspection Status Report', headers, keys, mapped, colWidths);
      }
    }
  } catch (error) {
    next(error);
  }
};

const getExpiredReport = async (req, res, next) => {
  const format = req.query.format || 'json';

  try {
    const sqlFilter = "WHERE status = 'EXPIRED' OR expiry_date < CURRENT_DATE";

    if (format === 'json') {
      const page = parseInt(req.query.page) || 1;
      const limit = parseInt(req.query.limit) || 10;
      const offset = (page - 1) * limit;

      const countRes = await db.query(`SELECT COUNT(*) FROM extinguishers ${sqlFilter}`);
      const total = parseInt(countRes.rows[0].count);

      const dataRes = await db.query(
        `SELECT * FROM extinguishers ${sqlFilter} ORDER BY id DESC LIMIT $1 OFFSET $2`,
        [limit, offset]
      );

      const totalPages = Math.ceil(total / limit);
      res.status(200).json({
        data: dataRes.rows.map(mapExtinguisher),
        total,
        page,
        limit,
        totalPages,
      });
    } else {
      const dataRes = await db.query(`SELECT * FROM extinguishers ${sqlFilter} ORDER BY id DESC`);
      const mapped = dataRes.rows.map(mapExtinguisher);

      if (format === 'csv') {
        const fields = ['id', 'serialNumber', 'location', 'type', 'size', 'expiryDate', 'status'];
        generateCsvResponse(res, 'expired_extinguishers_report', fields, mapped);
      } else {
        const headers = ['ID', 'Serial Number', 'Location', 'Type', 'Size', 'Expiry Date', 'Status'];
        const keys = ['id', 'serialNumber', 'location', 'type', 'size', 'expiryDate', 'status'];
        const colWidths = [30, 90, 142, 60, 50, 80, 60];
        generatePdfResponse(res, 'Expired Extinguishers Report', headers, keys, mapped, colWidths);
      }
    }
  } catch (error) {
    next(error);
  }
};

const getMainMaintenanceHistoryReport = async (req, res, next) => {
  const format = req.query.format || 'json';
  const extinguisherId = req.query.extinguisherId;
  const from = req.query.from;
  const to = req.query.to;

  try {
    let sqlFilter = 'WHERE 1=1';
    const params = [];

    if (extinguisherId) {
      params.push(extinguisherId);
      sqlFilter += ` AND i.extinguisher_id = $${params.length}`;
    }
    if (from) {
      params.push(from);
      sqlFilter += ` AND m.maintenance_date >= $${params.length}`;
    }
    if (to) {
      params.push(to);
      sqlFilter += ` AND m.maintenance_date <= $${params.length}`;
    }

    if (format === 'json') {
      const page = parseInt(req.query.page) || 1;
      const limit = parseInt(req.query.limit) || 10;
      const offset = (page - 1) * limit;

      const countRes = await db.query(
        `SELECT COUNT(*) FROM maintenance m JOIN inspections i ON m.inspection_id = i.id ${sqlFilter}`,
        params
      );
      const total = parseInt(countRes.rows[0].count);

      const queryParams = [...params, limit, offset];
      const dataRes = await db.query(
        `SELECT m.*, e.id AS extinguisher_id, e.serial_number, e.location, u.first_name || ' ' || u.last_name AS inspector_name
         FROM maintenance m
         JOIN inspections i ON m.inspection_id = i.id
         JOIN extinguishers e ON i.extinguisher_id = e.id
         JOIN users u ON m.inspector_id = u.id
         ${sqlFilter}
         ORDER BY m.id DESC
         LIMIT $${queryParams.length - 1} OFFSET $${queryParams.length}`,
        queryParams
      );

      const totalPages = Math.ceil(total / limit);
      res.status(200).json({
        data: dataRes.rows.map(mapMaintenance),
        total,
        page,
        limit,
        totalPages,
      });
    } else {
      const dataRes = await db.query(
        `SELECT m.*, e.id AS extinguisher_id, e.serial_number, e.location, u.first_name || ' ' || u.last_name AS inspector_name
         FROM maintenance m
         JOIN inspections i ON m.inspection_id = i.id
         JOIN extinguishers e ON i.extinguisher_id = e.id
         JOIN users u ON m.inspector_id = u.id
         ${sqlFilter}
         ORDER BY m.id DESC`,
        params
      );
      const mapped = dataRes.rows.map(mapMaintenance);

      if (format === 'csv') {
        const fields = ['id', 'maintenanceDate', 'serialNumber', 'location', 'inspectorName', 'actions', 'conditionsNoted'];
        generateCsvResponse(res, 'maintenance_history_report', fields, mapped);
      } else {
        const headers = ['ID', 'Date', 'Serial Number', 'Location', 'Inspector', 'Actions', 'Conditions'];
        const keys = ['id', 'maintenanceDate', 'serialNumber', 'location', 'inspectorName', 'actions', 'conditionsNoted'];
        const colWidths = [25, 55, 75, 77, 80, 100, 100];
        generatePdfResponse(res, 'Maintenance History Report', headers, keys, mapped, colWidths);
      }
    }
  } catch (error) {
    next(error);
  }
};

const getComplianceReport = async (req, res, next) => {
  const format = req.query.format || 'json';

  try {
    const countSql = `
      SELECT COUNT(*) FROM extinguishers e
      WHERE e.id NOT IN (
        SELECT DISTINCT extinguisher_id FROM inspections
        WHERE status = 'COMPLETED'
        AND inspection_date >= NOW() - INTERVAL '12 months'
      )
    `;

    const dataSqlBase = `
      SELECT e.* FROM extinguishers e
      WHERE e.id NOT IN (
        SELECT DISTINCT extinguisher_id FROM inspections
        WHERE status = 'COMPLETED'
        AND inspection_date >= NOW() - INTERVAL '12 months'
      )
      ORDER BY e.expiry_date ASC
    `;

    if (format === 'json') {
      const page = parseInt(req.query.page) || 1;
      const limit = parseInt(req.query.limit) || 10;
      const offset = (page - 1) * limit;

      const countRes = await db.query(countSql);
      const total = parseInt(countRes.rows[0].count);

      const dataRes = await db.query(`${dataSqlBase} LIMIT $1 OFFSET $2`, [limit, offset]);
      const totalPages = Math.ceil(total / limit);

      res.status(200).json({
        data: dataRes.rows.map(mapExtinguisher),
        total,
        page,
        limit,
        totalPages,
      });
    } else {
      const dataRes = await db.query(dataSqlBase);
      const mapped = dataRes.rows.map(mapExtinguisher);

      if (format === 'csv') {
        const fields = ['id', 'serialNumber', 'location', 'type', 'size', 'installationDate', 'expiryDate', 'status'];
        generateCsvResponse(res, 'compliance_report', fields, mapped);
      } else {
        const headers = ['ID', 'Serial Number', 'Location', 'Type', 'Size', 'Install Date', 'Expiry Date', 'Status'];
        const keys = ['id', 'serialNumber', 'location', 'type', 'size', 'installationDate', 'expiryDate', 'status'];
        const colWidths = [25, 80, 117, 50, 40, 70, 70, 60];
        generatePdfResponse(res, 'Extinguishers Non-Compliance Report', headers, keys, mapped, colWidths);
      }
    }
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getStockReport,
  getInspectionStatusReport,
  getExpiredReport,
  getMainMaintenanceHistoryReport,
  getComplianceReport,
};
