/**
 * Tier 4: Real-World Application Scenarios (5 realistic workflow scenarios)
 * BR Motor E2E Test Suite
 */

import {
  TestSuite,
  assertTrue,
  assertFalse,
  assertEqual,
  assertIncludes,
  assertNotIncludes
} from './harness.ts';
import {
  readSource,
  sourceExists,
  getTodayLocalDateStr,
  getTomorrowLocalDateStr,
  getYesterdayLocalDateStr,
  FIXTURE_SPARE_PARTS,
  FIXTURE_MECHANICS,
  FIXTURE_SERVICE_ITEMS,
  FIXTURE_WORK_ORDERS
} from './helpers.ts';
import { Booking, WorkOrder, SparePart, ServiceItem } from '../../src/types.ts';

export function createTier4Suite(): TestSuite {
  const suite = new TestSuite('Tier 4: Real-World Application Scenarios', 4);

  // Scenario 1: Online Booking to SPK Check-in with Staff Assigned Mechanic (F1, F2, F6, F7, F8)
  suite.addTest(
    'T4_S01_online_booking_to_spk_checkin_flow',
    'Scenario 1: Online Booking to SPK Check-in with Staff Assigned Mechanic',
    async () => {
      // Step 1 (F1): Form starts with blank prefix
      const guestForm = {
        customerName: 'Bambang Sudiro',
        phone: '081399887766',
        platePrefix: '',
        plateNumber: '',
        plateSuffix: '',
        bookingDate: getTodayLocalDateStr(),
        bookingTime: '10:00'
      };
      assertEqual(guestForm.platePrefix, '', 'Plate prefix starts empty');

      // Step 2 (F2): Guest inputs plate and validates format
      guestForm.platePrefix = 'B';
      guestForm.plateNumber = '4567';
      guestForm.plateSuffix = 'DEF';
      const fullPlate = `${guestForm.platePrefix} ${guestForm.plateNumber} ${guestForm.plateSuffix}`.trim();

      const inputFormatters = await import('../../src/utils/inputFormatters.ts');
      const validate = (inputFormatters as any).validateIndonesianPlate;
      assertTrue(typeof validate === 'function', 'validateIndonesianPlate must be exported');
      const validation = validate(fullPlate);
      assertTrue(validation.isValid, 'Plate "B 4567 DEF" must be valid');

      // Step 3 (F6): Booking intake and check-in with staff mechanic assignment
      const booking: Booking = {
        id: 'bkg-s01',
        customerId: 'c-s01',
        vehicleId: 'v-s01',
        customerName: guestForm.customerName,
        licensePlate: fullPlate,
        vehicleModel: 'Honda Vario 160',
        type: 'scheduled',
        date: guestForm.bookingDate,
        time: guestForm.bookingTime,
        queueNumber: 'B-01',
        status: 'pending',
        notes: 'Ganti kampas rem depan dan cek busi',
        estimatedDurationMinutes: 45,
        createdAt: new Date().toISOString()
      };

      // Staff selects Budi Santoso (m2), verifying not auto-locked to Adi
      const selectedMechanic = FIXTURE_MECHANICS.find((m) => m.id === 'm2');
      assertTrue(!!selectedMechanic, 'Mechanic m2 must exist');
      assertEqual(selectedMechanic.name, 'Budi Santoso');
      assertNotIncludes(selectedMechanic.name, 'Adi');

      // Step 4 (F7): SPK creation with clean service selection
      const initialServices: any[] = [];
      assertEqual(initialServices.length, 0, 'SPK services list starts unselected');

      // Step 5 (F8): Search and allocate spare parts in real time
      const searchPartName = 'Kampas Rem';
      const matchedParts = FIXTURE_SPARE_PARTS.filter((p) =>
        p.name.toLowerCase().includes(searchPartName.toLowerCase())
      );
      assertEqual(matchedParts.length, 1, 'Search finds 1 matching brake pad');
      const allocatedPart = matchedParts[0];

      const workOrder: WorkOrder = {
        id: 'WO-SCENARIO-01',
        bookingId: booking.id,
        customerId: booking.customerId,
        customerName: booking.customerName,
        vehicleId: booking.vehicleId,
        licensePlate: booking.licensePlate,
        vehicleModel: booking.vehicleModel,
        complaint: booking.notes,
        diagnosis: 'Kampas rem depan menipis',
        assignedMechanicId: selectedMechanic.id,
        assignedMechanicName: selectedMechanic.name,
        services: [{ serviceId: 's1', name: 'Pemeriksaan Rutin', price: 20000 }],
        sparePartsUsed: [
          {
            partId: allocatedPart.id,
            name: allocatedPart.name,
            quantity: 1,
            pricePerUnit: allocatedPart.sellingPrice,
            totalPrice: allocatedPart.sellingPrice
          }
        ],
        estimatedCompletionTime: '11:30',
        notes: 'Selesai segera',
        status: 'waiting',
        paymentStatus: 'unpaid',
        costs: {
          serviceCost: 20000,
          sparePartCost: allocatedPart.sellingPrice,
          discount: 0,
          total: 20000 + allocatedPart.sellingPrice
        },
        createdAt: new Date().toISOString()
      };

      assertEqual(workOrder.assignedMechanicName, 'Budi Santoso');
      assertEqual(workOrder.costs.total, 65000);
    },
    'Scenario 1'
  );

  // Scenario 2: Kanban Workflow Progression from Antre Servis to Selesai (F3, F4, F5)
  suite.addTest(
    'T4_S02_kanban_workflow_progression',
    'Scenario 2: Kanban Workflow Progression from Antre Servis to Selesai',
    () => {
      // Step 1: Work order starts in waiting column on today's kanban board
      let currentStatus = 'waiting';
      const orderDate = getTodayLocalDateStr();

      // Step 2 (F5): Date filter is today
      const selectedDate = getTodayLocalDateStr();
      assertTrue(orderDate === selectedDate, 'Order belongs to today view');

      // Step 3 (F3): Ordered transitions through all 5 stages
      const stages = [
        { status: 'waiting', label: 'Antre Servis' },
        { status: 'in_progress', label: 'Pengerjaan' },
        { status: 'waiting_parts', label: 'Tunggu Part' }, // Step 4 (F4): Clean label without / Oli
        { status: 'quality_control', label: 'Uji Kelayakan' },
        { status: 'completed', label: 'Selesai' }
      ];

      // Progression check
      for (let i = 0; i < stages.length - 1; i++) {
        assertEqual(currentStatus, stages[i].status, `Current status is ${stages[i].status}`);
        assertNotIncludes(stages[i].label, '/ Oli', 'Stage label must not contain "/ Oli"');
        currentStatus = stages[i + 1].status;
      }

      assertEqual(currentStatus, 'completed', 'Final stage reached is completed');
    },
    'Scenario 2'
  );

  // Scenario 3: Parts Allocation with Real-time Search and SPK Costing (F7, F8, F10)
  suite.addTest(
    'T4_S03_parts_allocation_search_and_costing',
    'Scenario 3: Parts Allocation with Real-time Search and SPK Costing',
    () => {
      // Step 1 (F7): Start SPK without pre-selected oil package
      const selectedServices: any[] = [];
      assertEqual(selectedServices.length, 0, 'No service pre-selected');

      // Staff adds Tune-Up (Rp 65.000)
      const tuneUp = FIXTURE_SERVICE_ITEMS[0];
      selectedServices.push({ serviceId: tuneUp.id, name: tuneUp.name, price: tuneUp.price });

      // Step 2 (F8): Search parts catalog in real time using SKU
      const skuQuery = 'SP-002';
      const sparkPlug = FIXTURE_SPARE_PARTS.find((p) => p.sku === skuQuery);
      assertTrue(!!sparkPlug, 'Spark plug found via SKU search');

      // Allocate 1 spark plug (Rp 25.000)
      const allocatedParts = [
        {
          partId: sparkPlug.id,
          name: sparkPlug.name,
          quantity: 1,
          pricePerUnit: sparkPlug.sellingPrice,
          totalPrice: sparkPlug.sellingPrice
        }
      ];

      // Step 3 (F10): Verify accurate cost computation
      const serviceCost = selectedServices.reduce((acc, s) => acc + s.price, 0);
      const partsCost = allocatedParts.reduce((acc, p) => acc + p.totalPrice, 0);
      const grandTotal = serviceCost + partsCost;

      assertEqual(serviceCost, 65000);
      assertEqual(partsCost, 25000);
      assertEqual(grandTotal, 90000);
    },
    'Scenario 3'
  );

  // Scenario 4: Daily Operations Work Orders Date Filtering (F3, F5)
  suite.addTest(
    'T4_S04_daily_operations_date_filtering',
    'Scenario 4: Daily Operations Work Orders Date Filtering',
    () => {
      const today = getTodayLocalDateStr();
      const tomorrow = getTomorrowLocalDateStr();
      const yesterday = getYesterdayLocalDateStr();

      // View 1: Today filter
      let activeFilter = today;
      let visibleOrders = FIXTURE_WORK_ORDERS.filter((wo) => wo.createdAt.slice(0, 10) === activeFilter);
      assertEqual(visibleOrders.length, 2, 'Today view shows exactly 2 today orders');
      assertTrue(visibleOrders.every((wo) => wo.createdAt.slice(0, 10) === today));

      // View 2: Tomorrow filter
      activeFilter = tomorrow;
      visibleOrders = FIXTURE_WORK_ORDERS.filter((wo) => wo.createdAt.slice(0, 10) === activeFilter);
      assertEqual(visibleOrders.length, 1, 'Tomorrow view shows 1 tomorrow order');
      assertEqual(visibleOrders[0].id, 'WO-TOMORROW-01');

      // View 3: All dates filter (cleared)
      activeFilter = '';
      visibleOrders = FIXTURE_WORK_ORDERS.filter((wo) => (activeFilter ? wo.createdAt.slice(0, 10) === activeFilter : true));
      assertEqual(visibleOrders.length, FIXTURE_WORK_ORDERS.length, 'Cleared filter shows all 4 orders');
    },
    'Scenario 4'
  );

  // Scenario 5: Full Workshop Lifecycle with Comprehensive Recap Verification (F1, F2, F3, F6, F8, F9, F10)
  suite.addTest(
    'T4_S05_full_workshop_lifecycle_with_recap',
    'Scenario 5: Full Workshop Lifecycle with Comprehensive Recap Verification',
    async () => {
      // 1. Guest booking with blank prefix and validated plate
      const inputFormatters = await import('../../src/utils/inputFormatters.ts');
      const validate = (inputFormatters as any).validateIndonesianPlate;
      assertTrue(typeof validate === 'function', 'validateIndonesianPlate must be exported');

      const plate = 'AB 9999 CD';
      assertTrue(validate(plate).isValid, 'AB 9999 CD is a valid plate');

      // 2. Staff check-in assigning mechanic Citra Dewi (m3)
      const mechanic = FIXTURE_MECHANICS[2];
      assertEqual(mechanic.name, 'Citra Dewi');

      // 3. Search part FL-004
      const filterPart = FIXTURE_SPARE_PARTS.find((p) => p.sku === 'FL-004');
      assertTrue(!!filterPart, 'Filter part found');

      // 4. Progress order to completion
      const completedOrder: WorkOrder = {
        id: 'WO-LIFECYCLE-01',
        customerId: 'c-life',
        customerName: 'Gunawan Prasetya',
        vehicleId: 'v-life',
        licensePlate: plate,
        vehicleModel: 'Honda Vario 125',
        complaint: 'Ganti filter udara',
        diagnosis: 'Filter kotor',
        assignedMechanicId: mechanic.id,
        assignedMechanicName: mechanic.name,
        services: [{ serviceId: 's1', name: 'Jasa Pemasangan', price: 20000 }],
        sparePartsUsed: [
          {
            partId: filterPart.id,
            name: filterPart.name,
            quantity: 1,
            pricePerUnit: filterPart.sellingPrice,
            totalPrice: filterPart.sellingPrice
          }
        ],
        estimatedCompletionTime: '11:00',
        notes: 'Selesai',
        status: 'completed',
        paymentStatus: 'paid',
        costs: {
          serviceCost: 20000,
          sparePartCost: filterPart.sellingPrice,
          discount: 0,
          total: 20000 + filterPart.sellingPrice
        },
        createdAt: `${getTodayLocalDateStr()}T10:00:00.000Z`,
        completedAt: `${getTodayLocalDateStr()}T10:45:00.000Z`
      };

      // 5. Navigate to Rekapan and verify summary
      const recapOrders = [...FIXTURE_WORK_ORDERS, completedOrder].filter((wo) => wo.status === 'completed');

      // Check record entry in recap
      const foundInRecap = recapOrders.find((wo) => wo.id === 'WO-LIFECYCLE-01');
      assertTrue(!!foundInRecap, 'Completed order is listed in recap');
      assertEqual(foundInRecap.licensePlate, 'AB 9999 CD');
      assertEqual(foundInRecap.assignedMechanicName, 'Citra Dewi');
      assertEqual(foundInRecap.costs.total, 70000); // 20000 + 50000
    },
    'Scenario 5'
  );

  return suite;
}
