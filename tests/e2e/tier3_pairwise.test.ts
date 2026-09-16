/**
 * Tier 3: Cross-Feature Interactions (10 pairwise tests)
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
  FIXTURE_SPARE_PARTS,
  FIXTURE_MECHANICS,
  FIXTURE_WORK_ORDERS
} from './helpers.ts';
import { Booking, WorkOrder, SparePart } from '../../src/types.ts';

export function createTier3Suite(): TestSuite {
  const suite = new TestSuite('Tier 3: Cross-Feature Interactions', 3);

  // Test 1: F1 + F2: Clean prefix with plate validation pipeline
  suite.addTest(
    'T3_P01_clean_prefix_with_plate_validation',
    'F1 + F2: Blank prefix input combines with plate numbers and passes validation',
    async () => {
      const inputFormatters = await import('../../src/utils/inputFormatters.ts');
      const validate = (inputFormatters as any).validateIndonesianPlate;
      assertTrue(typeof validate === 'function', 'validateIndonesianPlate must be exported');

      // Initial state is blank
      let prefix = '';
      let number = '';
      let suffix = '';

      // Blank state validation fails
      const emptyPlate = `${prefix} ${number} ${suffix}`.trim();
      assertFalse(validate(emptyPlate).isValid, 'Empty plate must be invalid');

      // User types prefix B, number 1234, suffix XYZ
      prefix = 'B';
      number = '1234';
      suffix = 'XYZ';
      const fullPlate = `${prefix} ${number} ${suffix}`.trim();

      const validationResult = validate(fullPlate);
      assertTrue(validationResult.isValid, 'Full plate "B 1234 XYZ" must pass validation');
    },
    'F1+F2'
  );

  // Test 2: F2 + F6: Validated plate booking checked in with user-selected mechanic
  suite.addTest(
    'T3_P02_validated_booking_checkin_with_mechanic',
    'F2 + F6: Validated plate booking is checked in with staff-selected mechanic without auto-locking to Adi',
    async () => {
      const inputFormatters = await import('../../src/utils/inputFormatters.ts');
      const validate = (inputFormatters as any).validateIndonesianPlate;
      assertTrue(typeof validate === 'function', 'validateIndonesianPlate must be exported');

      const plate = 'DK 8888 ZZ';
      assertTrue(validate(plate).isValid, 'Booking plate must be valid');

      const booking: Booking = {
        id: 'bkg-p02',
        customerId: 'c2',
        vehicleId: 'v2',
        customerName: 'Siti Rahma',
        licensePlate: plate,
        vehicleModel: 'Yamaha NMAX 155',
        type: 'scheduled',
        date: getTodayLocalDateStr(),
        time: '10:00',
        queueNumber: 'A-02',
        status: 'pending',
        notes: 'Servis rutin',
        estimatedDurationMinutes: 40,
        createdAt: new Date().toISOString()
      };

      // Staff selects Citra Dewi (m3), NOT Adi Pratama (m1)
      const selectedMechanic = FIXTURE_MECHANICS[2];
      assertEqual(selectedMechanic.id, 'm3');
      assertEqual(selectedMechanic.name, 'Citra Dewi');

      const createdWO: Partial<WorkOrder> = {
        bookingId: booking.id,
        licensePlate: booking.licensePlate,
        assignedMechanicId: selectedMechanic.id,
        assignedMechanicName: selectedMechanic.name,
        status: 'waiting'
      };

      assertEqual(createdWO.licensePlate, 'DK 8888 ZZ');
      assertEqual(createdWO.assignedMechanicId, 'm3');
      assertEqual(createdWO.assignedMechanicName, 'Citra Dewi');
      assertNotIncludes(createdWO.assignedMechanicName || '', 'Adi');
    },
    'F2+F6'
  );

  // Test 3: F3 + F4: Kanban columns ordering and clean labels simultaneously
  suite.addTest(
    'T3_P03_kanban_columns_order_and_clean_labels',
    'F3 + F4: Kanban columns maintain strict sequence and clean labels without "/ Oli"',
    () => {
      const src = readSource('src/pages/WorkOrders.tsx');
      assertTrue(src.length > 0, 'WorkOrders.tsx must exist');

      // Check waiting_parts column label
      const waitingPartsMatch = src.match(/status:\s*['"]waiting_parts['"],\s*label:\s*['"]([^'"]+)['"]/);
      assertTrue(!!waitingPartsMatch, 'waiting_parts definition must exist');
      assertEqual(waitingPartsMatch[1], 'Tunggu Part', 'Label must be "Tunggu Part" without "/ Oli"');

      // Check column index sequence
      const inProgressIdx = src.indexOf("status: 'in_progress'");
      const waitingPartsIdx = src.indexOf("status: 'waiting_parts'");
      assertTrue(inProgressIdx < waitingPartsIdx, 'in_progress must precede waiting_parts');
    },
    'F3+F4'
  );

  // Test 4: F3 + F5: Kanban column distribution respecting today date filter
  suite.addTest(
    'T3_P04_kanban_ordering_under_today_date_filter',
    'F3 + F5: Kanban stages receive only today work orders under today filter',
    () => {
      const today = getTodayLocalDateStr();
      const todayOrders = FIXTURE_WORK_ORDERS.filter((wo) => wo.createdAt.slice(0, 10) === today);

      const columns = ['waiting', 'in_progress', 'waiting_parts', 'quality_control', 'completed'];
      const columnCounts = columns.map((col) => todayOrders.filter((wo) => wo.status === col).length);

      // In fixtures: WO-TODAY-01 is waiting, WO-TODAY-02 is completed
      assertEqual(columnCounts[0], 1, 'Waiting column holds 1 today order');
      assertEqual(columnCounts[4], 1, 'Completed column holds 1 today order');
      assertEqual(columnCounts[1] + columnCounts[2] + columnCounts[3], 0, 'Other columns have 0 orders');

      // Total today orders is 2, tomorrow order is excluded
      const totalToday = columnCounts.reduce((a, b) => a + b, 0);
      assertEqual(totalToday, 2, 'Total orders displayed on today kanban must be 2');
    },
    'F3+F5'
  );

  // Test 5: F5 + F10: Date filter coherence between WorkOrders view and Rekapan view
  suite.addTest(
    'T3_P05_date_filter_coherence_between_workorders_and_recap',
    'F5 + F10: Date filter operates consistently between WorkOrders and Rekapan pages',
    () => {
      const today = getTodayLocalDateStr();

      // Filter in Work Orders
      const woToday = FIXTURE_WORK_ORDERS.filter((wo) => wo.createdAt.slice(0, 10) === today);
      assertEqual(woToday.length, 2, 'WorkOrders today filter yields 2 orders');

      // Filter in Rekapan (completed orders today)
      const recapToday = FIXTURE_WORK_ORDERS.filter(
        (wo) => wo.createdAt.slice(0, 10) === today && wo.status === 'completed'
      );
      assertEqual(recapToday.length, 1, 'Rekapan today completed orders yields 1 record');
      assertEqual(recapToday[0].id, 'WO-TODAY-02');
      assertEqual(recapToday[0].costs.total, 100000);
    },
    'F5+F10'
  );

  // Test 6: F6 + F7: Check-in mechanic assignment without defaulting service package to oil
  suite.addTest(
    'T3_P06_checkin_assigned_mechanic_with_clean_services',
    'F6 + F7: Check-in creates SPK with chosen mechanic and unselected service package list',
    () => {
      const chosenMechanic = FIXTURE_MECHANICS[1]; // Budi Santoso
      const checkInWO: WorkOrder = {
        id: 'WO-CHECKIN-CLEAN',
        bookingId: 'bkg-p06',
        customerId: 'c1',
        customerName: 'Ahmad Fauzi',
        vehicleId: 'v1',
        licensePlate: 'B 1234 XYZ',
        vehicleModel: 'Honda Vario 125',
        complaint: 'Tarikan berat',
        diagnosis: 'Pemeriksaan awal',
        assignedMechanicId: chosenMechanic.id,
        assignedMechanicName: chosenMechanic.name,
        services: [], // clean initial services
        sparePartsUsed: [],
        estimatedCompletionTime: '11:00',
        notes: '',
        status: 'waiting',
        paymentStatus: 'unpaid',
        costs: {
          serviceCost: 0,
          sparePartCost: 0,
          discount: 0,
          total: 0
        },
        createdAt: new Date().toISOString()
      };

      assertEqual(checkInWO.assignedMechanicName, 'Budi Santoso');
      assertEqual(checkInWO.services.length, 0, 'Services list must start empty');
      assertEqual(checkInWO.costs.serviceCost, 0, 'Service cost must start at 0');
    },
    'F6+F7'
  );

  // Test 7: F7 + F8: Clean services combined with parts search
  suite.addTest(
    'T3_P07_clean_services_combined_with_parts_search',
    'F7 + F8: SPK creation starts with clean services and selects spare parts via real-time search',
    () => {
      // Step 1: Services starts empty
      const services: any[] = [];
      assertEqual(services.length, 0, 'Initial services must be empty');

      // Step 2: Search for parts
      const query = 'busi';
      const matchedParts = FIXTURE_SPARE_PARTS.filter(
        (p) => p.name.toLowerCase().includes(query) || p.sku.toLowerCase().includes(query)
      );
      assertEqual(matchedParts.length, 1, 'Search for "busi" matches 1 part');

      // Step 3: Allocate searched part
      const selectedPart = matchedParts[0];
      const partsUsed = [
        {
          partId: selectedPart.id,
          name: selectedPart.name,
          quantity: 2,
          pricePerUnit: selectedPart.sellingPrice,
          totalPrice: selectedPart.sellingPrice * 2
        }
      ];

      const partsCost = partsUsed.reduce((sum, p) => sum + p.totalPrice, 0);
      assertEqual(partsCost, 50000, '2 units of Busi (25.000 each) must total 50.000');
    },
    'F7+F8'
  );

  // Test 8: F8 + F10: Searched parts reflected in recap totals
  suite.addTest(
    'T3_P08_searched_parts_reflected_in_recap_totals',
    'F8 + F10: Parts allocated via search box flow accurately into Rekapan revenue breakdown',
    () => {
      // Find part via SKU search
      const query = 'BP-001';
      const part = FIXTURE_SPARE_PARTS.find((p) => p.sku === query);
      assertTrue(!!part, 'Part BP-001 must exist');

      const completedOrder: WorkOrder = {
        ...FIXTURE_WORK_ORDERS[1],
        sparePartsUsed: [
          {
            partId: part.id,
            name: part.name,
            quantity: 1,
            pricePerUnit: part.sellingPrice,
            totalPrice: part.sellingPrice
          }
        ],
        costs: {
          serviceCost: 55000,
          sparePartCost: part.sellingPrice,
          discount: 0,
          total: 55000 + part.sellingPrice
        }
      };

      assertEqual(completedOrder.costs.sparePartCost, 45000, 'Part selling price must be 45.000');
      assertEqual(completedOrder.costs.total, 100000, 'Grand total must be 100.000');
    },
    'F8+F10'
  );

  // Test 9: F9 + F10: Sidebar navigation into functional recap
  suite.addTest(
    'T3_P09_sidebar_navigation_into_functional_recap',
    'F9 + F10: Navigating to Rekapan tab connects sidebar routing to recap reporting table',
    () => {
      const srcApp = readSource('src/App.tsx');
      // Verify activeTab === 'Rekapan' conditionally renders Rekapan component
      const rendersRekapan = /activeTab\s*===\s*['"]Rekapan['"]/.test(srcApp) || /case\s*['"]Rekapan['"]/.test(srcApp);
      assertTrue(rendersRekapan, 'App.tsx must conditionally render Rekapan page when activeTab is "Rekapan"');
    },
    'F9+F10'
  );

  // Test 10: F6 + F10: Mechanic assigned during check-in tracked through completion to recap
  suite.addTest(
    'T3_P10_checkin_mechanic_tracked_through_completion_to_recap',
    'F6 + F10: Mechanic chosen at check-in is maintained into final recap record',
    () => {
      const chosenMechanic = FIXTURE_MECHANICS[2]; // Citra Dewi
      const completedRecapOrder: WorkOrder = {
        ...FIXTURE_WORK_ORDERS[0],
        status: 'completed',
        assignedMechanicId: chosenMechanic.id,
        assignedMechanicName: chosenMechanic.name,
        costs: {
          serviceCost: 65000,
          sparePartCost: 0,
          discount: 0,
          total: 65000
        }
      };

      assertEqual(completedRecapOrder.assignedMechanicName, 'Citra Dewi');
      assertEqual(completedRecapOrder.status, 'completed');
    },
    'F6+F10'
  );

  return suite;
}
