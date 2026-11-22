import assert from 'node:assert/strict';
import test from 'node:test';
import { CARS } from '../data/cars.ts';
import { INITIAL_BOOKINGS } from '../data/store.ts';
import {
  bookingsToCsv,
  buildFinanceSchedule,
  buildHashForRoute,
  calculateFinancing,
  calculateMaxAffordableCarPrice,
  calculateTCO,
  filterCars,
  findCarsWithinMonthlyBudget,
  formatPriceWithSymbol,
  generateAssistantReply,
  getEffectivePriceEgp,
  matchCarsForQuiz,
  parseRouteFromHash,
  searchAndSortCars,
  shadeHexColor,
  updateBookingStatusInList,
  upsertCarInCatalog,
  validateVisitForm,
  verifyAdminPasscode,
} from './laneLogic.ts';

test('shadeHexColor computes lighter highlights and deeper shadows accurately', () => {
  assert.equal(shadeHexColor('#000000', 0.5), '#808080');
  assert.equal(shadeHexColor('#ffffff', -0.5), '#808080');
  assert.equal(shadeHexColor('#ed1c24', 0), '#ed1c24');
});

test('parseRouteFromHash and buildHashForRoute handle all multi-page routes', () => {
  assert.deepEqual(parseRouteFromHash(''), { page: 'home' });
  assert.deepEqual(parseRouteFromHash('#/cars'), { page: 'cars' });
  assert.deepEqual(parseRouteFromHash('#/cars/jetour-t1'), {
    page: 'car-detail',
    carId: 'jetour-t1',
  });
  assert.deepEqual(parseRouteFromHash('#/compare'), { page: 'compare' });
  assert.deepEqual(parseRouteFromHash('#/finance'), { page: 'finance' });
  assert.deepEqual(parseRouteFromHash('#/quiz'), { page: 'quiz' });
  assert.deepEqual(parseRouteFromHash('#/visit'), { page: 'visit' });
  assert.deepEqual(parseRouteFromHash('#/admin'), { page: 'admin' });
  assert.equal(buildHashForRoute({ page: 'car-detail', carId: 'byd-seal' }), '#/cars/byd-seal');
});

test('formatPriceWithSymbol formats EGP and converted USD cleanly', () => {
  const egp = formatPriceWithSymbol(1_730_000, 'EGP', 'en');
  assert.equal(egp, '1,730,000 ج.م');
  const usd = formatPriceWithSymbol(1_000_000, 'USD', 'en');
  assert.equal(usd, '$20,200');
});

test('getEffectivePriceEgp, filterCars, and searchAndSortCars support deals and sorting', () => {
  const sortedAsc = searchAndSortCars(CARS, {
    filter: 'all',
    favoriteIds: [],
    searchQuery: '',
    sort: 'price-asc',
    lang: 'en',
  });
  assert.ok(getEffectivePriceEgp(sortedAsc[0]) <= getEffectivePriceEgp(sortedAsc[sortedAsc.length - 1]));

  const whiteSearch = searchAndSortCars(CARS, {
    filter: 'all',
    favoriteIds: [],
    searchQuery: 'corolla',
    sort: 'featured',
    lang: 'en',
  });
  assert.equal(whiteSearch.length, 1);
  assert.equal(whiteSearch[0].id, 'toyota-corolla-white');

  const favOnly = filterCars(CARS, 'favorites', ['mg-5']);
  assert.equal(favOnly.length, 1);
});

test('matchCarsForQuiz prioritizes budget and category accurately', () => {
  const underBudgetSedans = matchCarsForQuiz(CARS, {
    who: 'personal',
    type: 'sedan',
    budget: 'under1.5',
    priority: 'economy',
  });
  assert.ok(underBudgetSedans.length >= 1);
  assert.equal(underBudgetSedans[0].type, 'sedan');
  assert.ok(getEffectivePriceEgp(underBudgetSedans[0]) < 1_500_000);
});

test('calculateFinancing, affordability solver, and TCO calculate accurately', () => {
  const result = calculateFinancing({
    priceEgp: 1_000_000,
    downPaymentPct: 25,
    months: 60,
    annualRatePct: 12,
  });
  assert.equal(result.downPaymentEgp, 250_000);
  assert.equal(result.loanPrincipalEgp, 750_000);
  assert.equal(result.monthlyPaymentEgp, 20_000);

  const maxPrice = calculateMaxAffordableCarPrice({
    monthlyBudgetEgp: 20_000,
    downPaymentPct: 25,
    months: 60,
    annualRatePct: 12,
  });
  assert.equal(maxPrice, 1_000_000);

  const within = findCarsWithinMonthlyBudget(CARS, {
    monthlyBudgetEgp: 22_000,
    downPaymentPct: 25,
    months: 60,
    annualRatePct: 13,
  });
  assert.ok(within.some((w) => w.car.id === 'mg-5'));

  const schedule = buildFinanceSchedule(1_000_000, 25, 13);
  assert.equal(schedule.length, 5);
  assert.ok(schedule[0].monthlyPaymentEgp > schedule[4].monthlyPaymentEgp);

  const petrolCar = CARS.find((c) => c.id === 'hyundai-elantra-ad')!;
  const evCar = CARS.find((c) => c.id === 'byd-seal')!;
  const tcoPetrol = calculateTCO({
    car: petrolCar,
    monthlyKm: 1500,
    fuelPriceEgpPerLiter: 15.25,
    electricityEgpPerKwh: 2.25,
  });
  const tcoEv = calculateTCO({
    car: evCar,
    monthlyKm: 1500,
    fuelPriceEgpPerLiter: 15.25,
    electricityEgpPerKwh: 2.25,
  });
  assert.ok(tcoEv.monthlyEnergyEgp < tcoPetrol.monthlyEnergyEgp);
});

test('admin catalog upsert, booking status update, CSV export, and passcode verification work', () => {
  const edited = upsertCarInCatalog(CARS, { ...CARS[0], priceEgp: 1_900_000 });
  assert.equal(edited.length, CARS.length);
  assert.equal(edited[0].priceEgp, 1_900_000);

  const csv = bookingsToCsv(INITIAL_BOOKINGS, CARS);
  assert.ok(csv.includes('Booking ID,Customer Name'));
  assert.ok(csv.includes('LANE-2041'));

  const updatedBookings = updateBookingStatusInList(INITIAL_BOOKINGS, 'LANE-2042', 'confirmed');
  assert.equal(updatedBookings[1].status, 'confirmed');
  assert.equal(verifyAdminPasscode('lane2026', 'lane2026'), true);
  assert.equal(verifyAdminPasscode('wrong', 'lane2026'), false);
});

test('validateVisitForm and generateAssistantReply handle edge cases', () => {
  assert.equal(validateVisitForm({ name: '', phone: '0123456789' }), 'required');
  assert.equal(validateVisitForm({ name: 'Ahmed', phone: '123' }), 'invalid_phone');
  assert.equal(validateVisitForm({ name: 'Ahmed', phone: '+20 127 455 5677' }), 'ok');

  const compare = generateAssistantReply('Compare MG 5 and BYD Seal', CARS, 'EGP', 'en');
  assert.match(compare, /MG 5 vs BYD Seal/);

  const sunnyReply = generateAssistantReply('نيسان صني', CARS, 'EGP', 'ar');
  assert.match(sunnyReply, /Nissan Sunny/);
});

test('every catalog vehicle has a valid HTTPS exterior photo and popular Egypt cars are included', () => {
  assert.ok(CARS.length >= 13);
  for (const car of CARS) {
    assert.ok(
      typeof car.img === 'string' && car.img.startsWith('https://'),
      `Missing exterior image for ${car.id}`,
    );
  }
  const ids = new Set(CARS.map((c) => c.id));
  for (const requiredId of ['nissan-sunny', 'hyundai-tucson', 'mg-zs', 'chery-arrizo-5', 'fiat-tipo', 'toyota-corolla-white', 'kia-sportage-white']) {
    assert.ok(ids.has(requiredId), `Missing car ${requiredId}`);
  }
});
