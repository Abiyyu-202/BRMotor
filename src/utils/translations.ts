/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export type Language = 'id' | 'en';

export const translations = {
  id: {
    // Brand & App
    appName: "BR Motor",
    appSubName: "Sistem Manajemen Bengkel",
    console: "Konsol Bengkel",
    accessLayer: "Hak Akses",
    signOut: "Keluar Sistem",
    simulating: "Simulasi Peran:",
    language: "Bahasa",
    indonesian: "Bahasa Indonesia",
    english: "English",

    // Navigation Tabs
    nav: {
      Dashboard: "Dashboard",
      Customers: "Data Pelanggan",
      Vehicles: "Data Motor",
      Bookings: "Jadwal Booking",
      "Work Orders": "Daftar Servis",
      Mechanics: "Data Mekanik",
      Inventory: "Stok Sparepart & Oli",
      Payments: "Kasir & Nota",
      Reports: "Laporan Omzet",
      Settings: "Pengaturan Bengkel",
    },

    // Roles
    roles: {
      owner: "Pemilik Bengkel",
      admin: "Admin Bengkel",
      mechanic: "Mekanik / Teknisi",
      cashier: "Kasir",
      user: "Pelanggan",
    },

    // Common Actions & Buttons
    actions: {
      add: "Tambah",
      edit: "Edit",
      delete: "Hapus",
      save: "Simpan",
      cancel: "Batal",
      search: "Cari...",
      filter: "Filter",
      clear: "Bersihkan",
      print: "Cetak / Print",
      checkout: "Proses Pembayaran",
      details: "Detail",
      close: "Tutup",
      confirm: "Konfirmasi",
      actions: "Aksi",
      status: "Status",
      date: "Tanggal",
      total: "Total",
      subtotal: "Subtotal",
      discount: "Diskon",
      tax: "Pajak",
      grandTotal: "GRAND TOTAL",
      viewAll: "Lihat Semua",
    },

    // Dashboard
    dashboard: {
      title: "Ringkasan Operasional Bengkel",
      subtitle: "Pantau antrean servis, status mekanik, pendapatan harian, dan ketersediaan stok.",
      todaysJobs: "Servis Hari Ini",
      activeWorkOrders: "SPK Aktif Di Bengkel",
      lowStockAlerts: "Peringatan Stok Tipis",
      revenueToday: "Pendapatan Hari Ini",
      quickActions: "Aksi Cepat",
      newBooking: "Booking Baru",
      newWorkOrder: "Buat SPK Baru",
      addCustomer: "Tambah Pelanggan",
      checkStock: "Cek Stok Part",
      liveQueue: "Antrean Servis Langsung",
      assignedMechanic: "Mekanik PJ",
      estimatedDone: "Estimasi Selesai",
    },

    // Customers
    customers: {
      title: "Direktori Pelanggan",
      subtitle: "Kelola riwayat data pemilik kendaraan dan kontak komunikasi.",
      addCustomer: "Tambah Pelanggan Baru",
      totalCustomers: "Total Pelanggan Terdaftar",
      searchPlaceholder: "Cari berdasarkan nama, telepon, atau alamat...",
      name: "Nama Lengkap",
      phone: "Nomor Telepon / WA",
      address: "Alamat Tempat Tinggal",
      registeredAt: "Tanggal Terdaftar",
      vehiclesOwned: "Jumlah Kendaraan",
    },

    // Vehicles
    vehicles: {
      title: "Data Kendaraan Bermotor",
      subtitle: "Daftar nomor polisi, merek, model, dan riwayat perawatan kendaraan.",
      addVehicle: "Tambah Kendaraan",
      plateNumber: "Nomor Polisi (Plat)",
      modelBrand: "Merek & Model",
      yearColor: "Tahun & Warna",
      ownerName: "Nama Pemilik",
      mileage: "Kilometer (KM)",
      lastService: "Servis Terakhir",
    },

    // Bookings
    bookings: {
      title: "Jadwal & Antrean Booking Servis",
      subtitle: "Kelola reservasi jadwal servis online dan kedatangan kendaraan pelanggan.",
      addBooking: "Buat Reservasi Baru",
      queueNo: "No. Antrean",
      customerVehicle: "Pelanggan & Motor",
      scheduledTime: "Waktu Reservasi",
      notes: "Keluhan / Catatan Servis",
      checkIn: "Check-In Ke Bengkel",
      confirmed: "Terkonfirmasi",
      pending: "Menunggu",
      completed: "Selesai",
      cancelled: "Dibatalkan",
    },

    // Work Orders
    workOrders: {
      title: "Pengerjaan",
      subtitle: "Pengerjaan servis, perbaikan mekanis, penggunaan suku cadang, dan penetapan teknisi.",
      createWO: "Buat SPK Servis Baru",
      ticketId: "No. SPK",
      customerBike: "Pelanggan & Kendaraan",
      mechanicInCharge: "Teknisi Penanggung Jawab",
      servicePackage: "Paket Servis & Suku Cadang",
      costEstimate: "Estimasi Biaya",
      statusStage: "Tahap Pengerjaan",
      waiting: "Menunggu Antrean",
      inProgress: "Dalam Pengerjaan",
      testing: "Uji Coba / QC",
      done: "Selesai (Siap Bayar)",
      billed: "Sudah Lunas",
    },

    // Mechanics
    mechanics: {
      title: "Daftar Mekanik & Teknisi",
      subtitle: "Pantau ketersediaan mekanik, jumlah pengerjaan, dan beban kerja tim bengkel.",
      addTechnician: "Tambah Teknisi Baru",
      totalTechs: "Total Mekanik",
      available: "Tersedia / Siap Kerjain",
      busy: "Sedang Mengerjakan Servis",
      inactive: "Cuti / Tidak Hadir",
      completedJobs: "Servis Selesai",
      activeJobs: "Servis Berjalan",
      rating: "Penilaian Customer",
    },

    // Inventory
    inventory: {
      title: "Inventaris Suku Cadang & Oli",
      subtitle: "Kelola stok sparepart, batas stok minimum, harga beli & harga jual.",
      addSparePart: "Tambah Suku Cadang",
      skuCode: "Kode SKU / Part No",
      partName: "Nama Suku Cadang",
      category: "Kategori",
      buyPrice: "Harga Beli (Modal)",
      sellPrice: "Harga Jual",
      stockQty: "Stok Saat Ini",
      minStock: "Stok Minimal",
      supplier: "Supplier / Pemasok",
      restock: "Restock (+10)",
      lowStockWarning: "Peringatan Stok Rendah",
    },

    // Payments
    payments: {
      title: "Kasir & Pembayaran Tagihan",
      subtitle: "Proses pembayaran servis, berikan diskon, dan cetak struk/nota pembayaran.",
      pendingPayments: "Tagihan Belum Lunas",
      paidArchive: "Arsip Lunas",
      cashTendered: "Uang Diterima (Tunai)",
      changeDue: "Kembalian",
      discountCoupon: "Diskon / Potongan",
      completeCheckout: "Selesaikan Pembayaran",
      printReceipt: "Cetak Struk Pembayaran",
      receiptHeader: "Nota Servis Motor",
      thankYou: "Terima kasih telah mempercayakan kendaraan Anda pada BR Motor",
    },

    // Reports
    reports: {
      title: "Laporan Omset & Performa",
      subtitle: "Analisis pendapatan harian, performa teknisi, dan suku cadang terlaris.",
      totalRevenue: "Total Pendapatan",
      settledInvoices: "Nota Terbayar",
      averageTicket: "Rata-rata Nota",
      dailyEarnings: "Grafik Pendapatan Harian",
      leaderboard: "Peringkat Mekanik",
      topParts: "Suku Cadang Terlaris",
      frequentServices: "Jasa Servis Terfavorit",
    },

    // Settings
    settings: {
      title: "Pengaturan Bengkel & Profil",
      subtitle: "Atur identitas bengkel, alamat, kontak, dan uji coba peran pengguna.",
      generalSpecs: "Informasi Identitas Bengkel",
      shopName: "Nama Bengkel / Usaha",
      email: "Email Dukungan / Layanan",
      address: "Alamat Lengkap Bengkel",
      phone: "Nomor Telepon / WA Bengkel",
      taxRate: "Tarif Pajak Servis (%)",
      currency: "Mata Uang Symbol",
      saveSpecs: "Simpan Pengaturan",
      switchProfile: "Ganti Profil Pengguna",
    }
  },

  en: {
    // Brand & App
    appName: "BR Motor",
    appSubName: "Workshop Management System",
    console: "Workshop Console",
    accessLayer: "Access Layer",
    signOut: "Sign Out System",
    simulating: "Simulating:",
    language: "Language",
    indonesian: "Bahasa Indonesia",
    english: "English",

    // Navigation Tabs
    nav: {
      Dashboard: "Dashboard",
      Customers: "Customers",
      Vehicles: "Vehicles",
      Bookings: "Bookings",
      "Work Orders": "Work Orders",
      Mechanics: "Mechanics",
      Inventory: "Inventory",
      Payments: "Payments",
      Reports: "Reports",
      Settings: "Settings",
    },

    // Roles
    roles: {
      owner: "Shop Owner",
      admin: "Admin Desk",
      mechanic: "Lead Mechanic",
      cashier: "Store Cashier",
      user: "Client",
    },

    // Common Actions & Buttons
    actions: {
      add: "Add",
      edit: "Edit",
      delete: "Delete",
      save: "Save",
      cancel: "Cancel",
      search: "Search...",
      filter: "Filter",
      clear: "Clear",
      print: "Print Receipt",
      checkout: "Checkout",
      details: "Details",
      close: "Close",
      confirm: "Confirm",
      actions: "Actions",
      status: "Status",
      date: "Date",
      total: "Total",
      subtotal: "Subtotal",
      discount: "Discount",
      tax: "Tax",
      grandTotal: "GRAND TOTAL",
      viewAll: "View All",
    },

    // Dashboard
    dashboard: {
      title: "Workshop Operations Overview",
      subtitle: "Monitor service queues, mechanic availability, daily revenue, and inventory alerts.",
      todaysJobs: "Today's Jobs",
      activeWorkOrders: "Active Work Orders",
      lowStockAlerts: "Low Stock Alerts",
      revenueToday: "Today's Revenue",
      quickActions: "Quick Actions",
      newBooking: "New Booking",
      newWorkOrder: "New Work Order",
      addCustomer: "Add Customer",
      checkStock: "Check Stock",
      liveQueue: "Live Service Queue",
      assignedMechanic: "Assigned Mechanic",
      estimatedDone: "Estimated Completion",
    },

    // Customers
    customers: {
      title: "Customer Directory",
      subtitle: "Manage vehicle owner records, contact details, and communication channels.",
      addCustomer: "Add New Customer",
      totalCustomers: "Total Registered Customers",
      searchPlaceholder: "Search by name, phone, or address...",
      name: "Full Name",
      phone: "Phone / WhatsApp",
      address: "Residential Address",
      registeredAt: "Registration Date",
      vehiclesOwned: "Vehicles Owned",
    },

    // Vehicles
    vehicles: {
      title: "Registered Vehicles",
      subtitle: "Track license plates, brands, models, and service maintenance history.",
      addVehicle: "Add Vehicle",
      plateNumber: "License Plate",
      modelBrand: "Brand & Model",
      yearColor: "Year & Color",
      ownerName: "Owner Name",
      mileage: "Odometer (KM)",
      lastService: "Last Serviced",
    },

    // Bookings
    bookings: {
      title: "Service Bookings & Reservations",
      subtitle: "Manage appointment reservations and scheduled client arrivals.",
      addBooking: "Create Reservation",
      queueNo: "Queue No.",
      customerVehicle: "Customer & Motorcycle",
      scheduledTime: "Scheduled Time",
      notes: "Issue / Service Notes",
      checkIn: "Check-In To Workshop",
      confirmed: "Confirmed",
      pending: "Pending",
      completed: "Completed",
      cancelled: "Cancelled",
    },

    // Work Orders
    workOrders: {
      title: "Work Orders",
      subtitle: "Manage active service tickets, parts usage, diagnostic labor, and mechanic assignments.",
      createWO: "Create New Work Order",
      ticketId: "WO Ticket ID",
      customerBike: "Customer & Vehicle",
      mechanicInCharge: "Assigned Mechanic",
      servicePackage: "Services & Spare Parts",
      costEstimate: "Estimated Cost",
      statusStage: "Progress Stage",
      waiting: "Waiting Queue",
      inProgress: "In Servicing",
      testing: "Quality Check",
      done: "Ready for Billing",
      billed: "Paid & Archived",
    },

    // Mechanics
    mechanics: {
      title: "Mechanics & Technicians Roster",
      subtitle: "Monitor technician availability, job counts, and service bay assignments.",
      addTechnician: "Add New Technician",
      totalTechs: "Total Mechanics",
      available: "Available / Ready",
      busy: "Busy Servicing",
      inactive: "On Leave / Inactive",
      completedJobs: "Completed Jobs",
      activeJobs: "Active Jobs",
      rating: "Customer Rating",
    },

    // Inventory
    inventory: {
      title: "Spare Parts & Oil Inventory",
      subtitle: "Maintain stock quantities, configure safety minimum limits, and supplier costs.",
      addSparePart: "Add Spare Part",
      skuCode: "SKU / Part No",
      partName: "Item Name",
      category: "Category",
      buyPrice: "Purchase Cost",
      sellPrice: "Selling Price",
      stockQty: "Current Stock",
      minStock: "Minimum Margin",
      supplier: "Supplier",
      restock: "Restock (+10)",
      lowStockWarning: "Low Stock Warning",
    },

    // Payments
    payments: {
      title: "Billing & Cashier Register",
      subtitle: "Collect service payments, apply cash discounts, and print customer receipts.",
      pendingPayments: "Pending Payments",
      paidArchive: "Paid Archive",
      cashTendered: "Cash Tendered",
      changeDue: "Change Refund",
      discountCoupon: "Discount / Voucher",
      completeCheckout: "Complete Checkout Payment",
      printReceipt: "Print Invoice Receipt",
      receiptHeader: "Motorcycle Service Invoice",
      thankYou: "Thank you for riding with BR Motor",
    },

    // Reports
    reports: {
      title: "Executive Reports & Analytics",
      subtitle: "Analyze revenue trends, top maintenance services, and mechanic efficiency.",
      totalRevenue: "All-Time Revenue",
      settledInvoices: "Settled Invoices",
      averageTicket: "Average Ticket",
      dailyEarnings: "Daily Earnings Breakdown",
      leaderboard: "Mechanic Leaderboard",
      topParts: "Best Selling Parts",
      frequentServices: "Most Frequent Services",
    },

    // Settings
    settings: {
      title: "Shop Settings & Preferences",
      subtitle: "Configure workshop profile, contact details, tax rules, and user role simulation.",
      generalSpecs: "General Store Specifications",
      shopName: "Shop / Company Name",
      email: "Support Email Address",
      address: "Registered Physical Address",
      phone: "Contact Phone",
      taxRate: "Tax Ledger Rate (%)",
      currency: "Currency Symbol",
      saveSpecs: "Save Configurations",
      switchProfile: "Switch Staff Profile",
    }
  }
};
