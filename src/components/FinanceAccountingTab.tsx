import { useMemo, useState } from 'react';
import { ArrowDownLeft, ArrowUpRight, Download, FileText, Plus, ShieldCheck, WalletCards } from 'lucide-react';
import type { CarModel, LangCode } from '../data/cars';
import type {
  FinanceCategory,
  FinanceEntry,
  FinanceEntryType,
  FinancePaymentMethod,
} from '../data/store';

interface FinanceAccountingTabProps {
  entries: FinanceEntry[];
  status: 'loading' | 'ready' | 'error';
  cars: CarModel[];
  lang: LangCode;
  onAddEntry: (entry: FinanceEntry) => Promise<void>;
  onVoidEntry: (entry: FinanceEntry) => Promise<void>;
}

type FinancePeriod = 'month' | 'quarter' | 'year' | 'all';
type FinanceFilter = 'all' | FinanceEntryType;

const categoryNames: Record<FinanceCategory, { ar: string; en: string }> = {
  'car-sale': { ar: 'بيع سيارة جديدة', en: 'New car sale' },
  deposit: { ar: 'مقدم / عربون', en: 'Deposit' },
  commission: { ar: 'عمولة', en: 'Commission' },
  'other-income': { ar: 'إيراد آخر', en: 'Other income' },
  supplier: { ar: 'مورد / تكلفة شراء', en: 'Supplier / purchase cost' },
  operations: { ar: 'تشغيل المعرض', en: 'Showroom operations' },
  marketing: { ar: 'تسويق وإعلانات', en: 'Marketing' },
  salaries: { ar: 'رواتب وأتعاب', en: 'Salaries / fees' },
  delivery: { ar: 'تسليم ونقل', en: 'Delivery / transport' },
  'other-expense': { ar: 'مصروف آخر', en: 'Other expense' },
};

const incomeCategories: FinanceCategory[] = ['car-sale', 'deposit', 'commission', 'other-income'];
const expenseCategories: FinanceCategory[] = ['supplier', 'operations', 'marketing', 'salaries', 'delivery', 'other-expense'];

function localDateInputValue(date = new Date()): string {
  const local = new Date(date.getTime() - date.getTimezoneOffset() * 60_000);
  return local.toISOString().slice(0, 10);
}

function monthStart(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), 1);
}

function startOfPeriod(period: FinancePeriod): Date | null {
  const now = new Date();
  if (period === 'month') return monthStart(now);
  if (period === 'quarter') return new Date(now.getFullYear(), Math.floor(now.getMonth() / 3) * 3, 1);
  if (period === 'year') return new Date(now.getFullYear(), 0, 1);
  return null;
}

function money(value: number, lang: LangCode): string {
  return `${new Intl.NumberFormat(lang === 'ar' ? 'ar-EG' : lang, {
    maximumFractionDigits: 2,
  }).format(value)} ج.م`;
}

function csvCell(value: unknown): string {
  const text = String(value ?? '');
  return `"${text.replaceAll('"', '""')}"`;
}

function downloadEntriesCsv(entries: FinanceEntry[], cars: CarModel[], isAr: boolean) {
  const rows = [
    isAr
      ? ['التاريخ', 'النوع', 'البند', 'المبلغ بالجنيه', 'طريقة الدفع', 'السيارة', 'الطرف', 'المرجع', 'الحالة', 'ملاحظات']
      : ['Date', 'Type', 'Category', 'Amount EGP', 'Payment method', 'Car', 'Counterparty', 'Reference', 'Status', 'Notes'],
    ...entries.map((entry) => [
      entry.occurredOn,
      isAr ? (entry.type === 'income' ? 'إيراد' : 'مصروف') : entry.type,
      categoryNames[entry.category][isAr ? 'ar' : 'en'],
      entry.amountEgp,
      entry.paymentMethod,
      cars.find((car) => car.id === entry.carId)?.name || '',
      entry.counterparty || '',
      entry.reference || '',
      isAr ? (entry.status === 'posted' ? 'مسجلة' : 'ملغاة') : entry.status,
      entry.voidReason || entry.notes || '',
    ]),
  ];
  const csv = `\uFEFF${rows.map((row) => row.map(csvCell).join(',')).join('\r\n')}`;
  const url = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8' }));
  const link = document.createElement('a');
  link.href = url;
  link.download = `lane-ledger-${localDateInputValue()}.csv`;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}

export function FinanceAccountingTab({ entries, status, cars, lang, onAddEntry, onVoidEntry }: FinanceAccountingTabProps) {
  const isAr = lang === 'ar';
  const copy = isAr
    ? {
      title: 'دفتر الحسابات', intro: 'سجّلي حركة النقد الفعلية للمعرض. طلبات الزيارة لا تُحسب إيرادًا تلقائيًا.', add: 'قيد مالي جديد', income: 'إيراد', expense: 'مصروف', date: 'تاريخ العملية', amount: 'المبلغ بالجنيه', category: 'البند', payment: 'طريقة الدفع', car: 'السيارة (اختياري)', noCar: 'بدون سيارة محددة', party: 'العميل / المورد (اختياري)', reference: 'رقم إيصال / مرجع', notes: 'ملاحظات', save: 'حفظ القيد', saving: 'جارٍ الحفظ…', month: 'هذا الشهر', quarter: 'هذا الربع', year: 'هذه السنة', allTime: 'كل الفترات', revenue: 'الإيرادات', expenses: 'المصروفات', net: 'صافي الحركة', count: 'عدد القيود', trend: 'الحركة خلال 6 أشهر', ledger: 'سجل العمليات', all: 'الكل', search: 'ابحث في البند أو الطرف أو المرجع…', empty: 'لا توجد قيود في الفترة المحددة.', void: 'إلغاء القيد', confirmVoid: 'تأكيد الإلغاء', cancel: 'رجوع', voidReason: 'سبب الإلغاء (اختياري)', posted: 'مسجل', voided: 'ملغى', showPosted: 'القيود المسجلة', showVoided: 'القيود الملغاة', secure: 'سجلات الحسابات خاصة بالإدارة فقط', saved: 'تم حفظ القيد المالي.', voidedMsg: 'تم إلغاء القيد مع الاحتفاظ به في السجل.', error: 'تعذر حفظ البيانات. تأكدي من اتصال Firebase.', audit: 'للتصحيح: ألغِ القيد الخاطئ وسجّلي القيد الصحيح؛ لا تُحذف القيود نهائيًا.', incomeOnly: 'إيراد', expenseOnly: 'مصروف', cash: 'نقدي', bank: 'تحويل بنكي', wallet: 'محفظة إلكترونية', card: 'بطاقة', otherMethod: 'أخرى', netPositive: 'فائض', netNegative: 'عجز',
    }
    : {
      title: 'Accounting ledger', intro: 'Record the showroom’s real cash movements. Visit requests are never counted as revenue automatically.', add: 'New entry', income: 'Income', expense: 'Expense', date: 'Transaction date', amount: 'Amount in EGP', category: 'Category', payment: 'Payment method', car: 'Car (optional)', noCar: 'No specific car', party: 'Customer / supplier (optional)', reference: 'Receipt / reference', notes: 'Notes', save: 'Save entry', saving: 'Saving…', month: 'This month', quarter: 'This quarter', year: 'This year', allTime: 'All time', revenue: 'Revenue', expenses: 'Expenses', net: 'Net cash flow', count: 'Entries', trend: 'Cash flow · last 6 months', ledger: 'Transactions', all: 'All', search: 'Search category, party, reference…', empty: 'No entries in this period.', void: 'Void entry', confirmVoid: 'Confirm void', cancel: 'Cancel', voidReason: 'Reason for void (optional)', posted: 'Posted', voided: 'Voided', showPosted: 'Posted entries', showVoided: 'Voided entries', secure: 'Accounting records are admin-only', saved: 'Financial entry saved.', voidedMsg: 'Entry voided and retained in the ledger.', error: 'Could not save. Check the Firebase connection.', audit: 'For corrections, void the wrong entry and add a correct one; entries are never permanently deleted.', incomeOnly: 'Income', expenseOnly: 'Expense', cash: 'Cash', bank: 'Bank transfer', wallet: 'E-wallet', card: 'Card', otherMethod: 'Other', netPositive: 'Surplus', netNegative: 'Deficit',
    };

  const [type, setType] = useState<FinanceEntryType>('income');
  const [category, setCategory] = useState<FinanceCategory>('car-sale');
  const [occurredOn, setOccurredOn] = useState(localDateInputValue());
  const [amount, setAmount] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<FinancePaymentMethod>('bank');
  const [carId, setCarId] = useState('');
  const [counterparty, setCounterparty] = useState('');
  const [reference, setReference] = useState('');
  const [notes, setNotes] = useState('');
  const [period, setPeriod] = useState<FinancePeriod>('month');
  const [filter, setFilter] = useState<FinanceFilter>('all');
  const [statusFilter, setStatusFilter] = useState<'posted' | 'voided'>('posted');
  const [search, setSearch] = useState('');
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState('');
  const [voidingId, setVoidingId] = useState<string | null>(null);
  const [voidReason, setVoidReason] = useState('');

  const categories = type === 'income' ? incomeCategories : expenseCategories;
  const periodEntries = useMemo(() => {
    const start = startOfPeriod(period);
    return entries
      .filter((entry) => entry.status === 'posted')
      .filter((entry) => !start || entry.occurredOn >= localDateInputValue(start));
  }, [entries, period]);
  const visibleEntries = useMemo(() => {
    const start = startOfPeriod(period);
    const term = search.trim().toLocaleLowerCase();
    return entries
      .filter((entry) => entry.status === statusFilter)
      .filter((entry) => !start || entry.occurredOn >= localDateInputValue(start))
      .filter((entry) => filter === 'all' || entry.type === filter)
      .filter((entry) => {
        if (!term) return true;
        const car = cars.find((model) => model.id === entry.carId)?.name || '';
        return [entry.counterparty, entry.reference, entry.notes, entry.voidReason, categoryNames[entry.category][isAr ? 'ar' : 'en'], car]
          .some((value) => value?.toLocaleLowerCase().includes(term));
      })
      .sort((a, b) => b.occurredOn.localeCompare(a.occurredOn) || b.createdAt.localeCompare(a.createdAt));
  }, [entries, period, filter, statusFilter, search, cars, isAr]);

  const totals = useMemo(() => periodEntries.reduce((acc, entry) => {
    if (entry.type === 'income') acc.income += entry.amountEgp;
    else acc.expense += entry.amountEgp;
    return acc;
  }, { income: 0, expense: 0 }), [periodEntries]);

  const monthlyFlow = useMemo(() => Array.from({ length: 6 }, (_, offset) => {
    const date = new Date();
    date.setDate(1);
    date.setMonth(date.getMonth() - (5 - offset));
    const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
    const label = new Intl.DateTimeFormat(isAr ? 'ar-EG' : lang, { month: 'short' }).format(date);
    const monthEntries = entries.filter((entry) => entry.status === 'posted' && entry.occurredOn.startsWith(key));
    return {
      key,
      label,
      income: monthEntries.filter((entry) => entry.type === 'income').reduce((sum, entry) => sum + entry.amountEgp, 0),
      expense: monthEntries.filter((entry) => entry.type === 'expense').reduce((sum, entry) => sum + entry.amountEgp, 0),
    };
  }), [entries, isAr, lang]);
  const maxFlow = Math.max(1, ...monthlyFlow.flatMap((month) => [month.income, month.expense]));

  const onTypeChange = (nextType: FinanceEntryType) => {
    setType(nextType);
    setCategory(nextType === 'income' ? 'car-sale' : 'supplier');
  };

  const saveEntry = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const amountEgp = Number(amount);
    if (!Number.isFinite(amountEgp) || amountEgp <= 0) {
      setMessage(isAr ? 'أدخلي مبلغًا صحيحًا أكبر من صفر.' : 'Enter a valid amount greater than zero.');
      return;
    }
    setBusy(true);
    setMessage('');
    const entry: FinanceEntry = {
      id: `fin-${crypto.randomUUID()}`,
      type,
      category,
      amountEgp,
      occurredOn,
      paymentMethod,
      ...(carId ? { carId } : {}),
      ...(counterparty.trim() ? { counterparty: counterparty.trim() } : {}),
      ...(reference.trim() ? { reference: reference.trim() } : {}),
      ...(notes.trim() ? { notes: notes.trim() } : {}),
      status: 'posted',
      createdAt: new Date().toISOString(),
    };
    try {
      await onAddEntry(entry);
      setAmount('');
      setCounterparty('');
      setReference('');
      setNotes('');
      setCarId('');
      setMessage(copy.saved);
    } catch {
      setMessage(copy.error);
    } finally {
      setBusy(false);
    }
  };

  const confirmVoid = async (entry: FinanceEntry) => {
    setBusy(true);
    try {
      await onVoidEntry({ ...entry, status: 'voided', voidedAt: new Date().toISOString(), ...(voidReason.trim() ? { voidReason: voidReason.trim() } : {}) });
      setVoidingId(null);
      setVoidReason('');
      setMessage(copy.voidedMsg);
    } catch {
      setMessage(copy.error);
    } finally {
      setBusy(false);
    }
  };

  const labelForCategory = (key: FinanceCategory) => categoryNames[key][isAr ? 'ar' : 'en'];
  const paymentLabel = (key: FinancePaymentMethod) => ({ cash: copy.cash, bank: copy.bank, wallet: copy.wallet, card: copy.card, other: copy.otherMethod })[key];
  const categoryTitle = (key: FinanceCategory) => labelForCategory(key);
  const storageStatus = status === 'ready'
    ? ''
    : status === 'loading'
      ? (isAr ? 'جارٍ تحميل الحسابات الآمنة…' : 'Loading the secure ledger…')
      : (isAr ? 'قواعد Firebase للحسابات غير منشورة بعد. لا تحفظي أي قيد حتى تفعيل القواعد الجديدة.' : 'The accounting Firestore rules are not published yet. Entries are disabled until the new rules are active.');

  return (
    <div className="mt-8 space-y-6">
      <header className="flex flex-wrap items-end justify-between gap-4 border-b border-[#252528] pb-5">
        <div>
          <span className="font-latin text-[10px] font-bold tracking-[0.2em] text-[#ed1c24]">LANE · CASHBOOK</span>
          <h2 className="mt-2 text-2xl font-bold text-[#f5f3ef]">{copy.title}</h2>
          <p className="mt-2 max-w-3xl text-xs leading-6 text-[#a8a39d]">{copy.intro}</p>
        </div>
        <div className="inline-flex items-center gap-2 rounded-full border border-emerald-500/20 bg-emerald-500/[0.06] px-3 py-2 text-[11px] text-emerald-200">
          <ShieldCheck className="h-4 w-4" />{copy.secure}
        </div>
      </header>
      {storageStatus && <div role={status === 'error' ? 'alert' : 'status'} className={`rounded-xl border px-4 py-3 text-xs leading-6 ${status === 'error' ? 'border-amber-400/25 bg-amber-400/[0.06] text-amber-100' : 'border-white/10 bg-white/[0.03] text-white/55'}`}>{storageStatus}</div>}

      <div className="flex flex-wrap gap-2" aria-label={isAr ? 'اختيار الفترة' : 'Period filter'}>
        {(['month', 'quarter', 'year', 'all'] as const).map((item) => (
          <button key={item} type="button" onClick={() => setPeriod(item)} className={`h-9 rounded-full border px-4 text-xs font-semibold transition ${period === item ? 'border-[#ed1c24] bg-[#ed1c24] text-white' : 'border-[#323236] bg-[#131315] text-[#c7c3bd] hover:border-[#777]'}`}>
            {item === 'month' ? copy.month : item === 'quarter' ? copy.quarter : item === 'year' ? copy.year : copy.allTime}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {[
          { label: copy.revenue, value: totals.income, icon: ArrowDownLeft, color: 'text-emerald-300', surface: 'from-emerald-500/10' },
          { label: copy.expenses, value: totals.expense, icon: ArrowUpRight, color: 'text-rose-300', surface: 'from-rose-500/10' },
          { label: copy.net, value: totals.income - totals.expense, icon: WalletCards, color: totals.income >= totals.expense ? 'text-[#d8b789]' : 'text-rose-300', surface: 'from-amber-500/10' },
          { label: copy.count, value: visibleEntries.length, icon: FileText, color: 'text-white', surface: 'from-white/[0.06]' },
        ].map((item) => {
          const Icon = item.icon;
          return (
            <div key={item.label} className={`rounded-2xl border border-white/[0.08] bg-gradient-to-br ${item.surface} to-[#121214] p-5`}>
              <div className="flex items-center justify-between gap-3 text-xs text-[#a8a39d]"><span>{item.label}</span><Icon className={`h-4 w-4 ${item.color}`} /></div>
              <strong dir="ltr" className={`mt-3 block text-start font-latin text-xl font-bold tabular-nums ${item.color}`}>{item.label === copy.count ? item.value : money(item.value, lang)}</strong>
              {item.label === copy.net && <span className="mt-1 block text-[10px] text-white/40">{item.value >= 0 ? copy.netPositive : copy.netNegative}</span>}
            </div>
          );
        })}
      </div>

      <div className="grid gap-5 xl:grid-cols-[minmax(0,1.05fr)_minmax(380px,.95fr)]">
        <form onSubmit={(event) => void saveEntry(event)} className="rounded-2xl border border-[#2b2b30] bg-[#121214] p-5 sm:p-6">
          <div className="flex items-center gap-3 border-b border-white/[0.08] pb-4">
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#ed1c24]/10 text-[#ff7278]"><Plus className="h-4 w-4" /></span>
            <div><h3 className="text-sm font-bold text-white">{copy.add}</h3><p className="mt-1 text-[10px] text-white/40">EGP · مصر</p></div>
          </div>

          <div className="mt-5 grid gap-3 sm:grid-cols-2">
            <div className="sm:col-span-2 grid grid-cols-2 gap-2 rounded-xl bg-black/25 p-1">
              {(['income', 'expense'] as const).map((item) => (
                <button key={item} type="button" onClick={() => onTypeChange(item)} className={`flex h-10 items-center justify-center gap-2 rounded-lg text-xs font-bold transition ${type === item ? (item === 'income' ? 'bg-emerald-500/15 text-emerald-200' : 'bg-rose-500/15 text-rose-200') : 'text-white/45 hover:text-white/80'}`}>
                  {item === 'income' ? <ArrowDownLeft className="h-3.5 w-3.5" /> : <ArrowUpRight className="h-3.5 w-3.5" />}{item === 'income' ? copy.income : copy.expense}
                </button>
              ))}
            </div>
            <label className="text-[11px] text-[#b9b4ae]">{copy.amount}
              <input required min="0.01" step="0.01" type="number" inputMode="decimal" value={amount} onChange={(event) => setAmount(event.target.value)} placeholder="0.00" className="mt-1.5 h-11 w-full rounded-lg border border-[#353539] bg-[#09090a] px-3 font-latin text-sm text-white outline-none transition focus:border-[#ed1c24]" />
            </label>
            <label className="text-[11px] text-[#b9b4ae]">{copy.date}
              <input required type="date" value={occurredOn} onChange={(event) => setOccurredOn(event.target.value)} className="mt-1.5 h-11 w-full rounded-lg border border-[#353539] bg-[#09090a] px-3 font-latin text-xs text-white outline-none focus:border-[#ed1c24]" />
            </label>
            <label className="text-[11px] text-[#b9b4ae]">{copy.category}
              <select value={category} onChange={(event) => setCategory(event.target.value as FinanceCategory)} className="mt-1.5 h-11 w-full rounded-lg border border-[#353539] bg-[#09090a] px-3 text-xs text-white outline-none focus:border-[#ed1c24]">
                {categories.map((item) => <option key={item} value={item}>{labelForCategory(item)}</option>)}
              </select>
            </label>
            <label className="text-[11px] text-[#b9b4ae]">{copy.payment}
              <select value={paymentMethod} onChange={(event) => setPaymentMethod(event.target.value as FinancePaymentMethod)} className="mt-1.5 h-11 w-full rounded-lg border border-[#353539] bg-[#09090a] px-3 text-xs text-white outline-none focus:border-[#ed1c24]">
                {(['bank', 'cash', 'wallet', 'card', 'other'] as const).map((item) => <option key={item} value={item}>{paymentLabel(item)}</option>)}
              </select>
            </label>
            <label className="text-[11px] text-[#b9b4ae]">{copy.car}
              <select value={carId} onChange={(event) => setCarId(event.target.value)} className="mt-1.5 h-11 w-full rounded-lg border border-[#353539] bg-[#09090a] px-3 text-xs text-white outline-none focus:border-[#ed1c24]"><option value="">{copy.noCar}</option>{cars.map((car) => <option key={car.id} value={car.id}>{car.name}</option>)}</select>
            </label>
            <label className="text-[11px] text-[#b9b4ae]">{copy.party}
              <input maxLength={120} value={counterparty} onChange={(event) => setCounterparty(event.target.value)} className="mt-1.5 h-11 w-full rounded-lg border border-[#353539] bg-[#09090a] px-3 text-xs text-white outline-none focus:border-[#ed1c24]" />
            </label>
            <label className="text-[11px] text-[#b9b4ae]">{copy.reference}
              <input maxLength={80} value={reference} onChange={(event) => setReference(event.target.value)} className="mt-1.5 h-11 w-full rounded-lg border border-[#353539] bg-[#09090a] px-3 text-xs text-white outline-none focus:border-[#ed1c24]" />
            </label>
            <label className="sm:col-span-2 text-[11px] text-[#b9b4ae]">{copy.notes}
              <textarea maxLength={500} value={notes} onChange={(event) => setNotes(event.target.value)} rows={2} className="mt-1.5 w-full resize-y rounded-lg border border-[#353539] bg-[#09090a] px-3 py-2.5 text-xs leading-5 text-white outline-none focus:border-[#ed1c24]" />
            </label>
          </div>
          <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
            <p role={message.includes(copy.error) ? 'alert' : 'status'} className={`text-[11px] ${message.includes(copy.error) ? 'text-rose-300' : 'text-white/50'}`}>{message || copy.audit}</p>
            <button type="submit" disabled={busy || status !== 'ready'} className="inline-flex h-11 items-center gap-2 rounded-lg bg-[#ed1c24] px-5 text-xs font-bold text-white transition hover:bg-[#cf1720] disabled:cursor-not-allowed disabled:opacity-50"><Plus className="h-4 w-4" />{busy ? copy.saving : copy.save}</button>
          </div>
        </form>

        <section className="rounded-2xl border border-[#2b2b30] bg-[#121214] p-5 sm:p-6">
          <div className="flex items-center justify-between gap-3"><div><h3 className="text-sm font-bold text-white">{copy.trend}</h3><p className="mt-1 text-[10px] text-white/40">{isAr ? 'الجنيه المصري · القيود المسجلة' : 'EGP · posted entries'}</p></div>
            <div className="flex gap-3 text-[10px]"><span className="inline-flex items-center gap-1 text-emerald-200"><span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />{copy.income}</span><span className="inline-flex items-center gap-1 text-rose-200"><span className="h-1.5 w-1.5 rounded-full bg-rose-400" />{copy.expense}</span></div>
          </div>
          <div className="mt-8 grid h-48 grid-cols-6 gap-3 border-b border-white/10">
            {monthlyFlow.map((month) => (
              <div key={month.key} className="flex min-w-0 flex-col items-center justify-end gap-2">
                <div className="flex h-36 w-full items-end justify-center gap-1.5">
                  <div title={`${copy.income}: ${money(month.income, lang)}`} className="w-[clamp(8px,30%,18px)] min-h-0 rounded-t-sm bg-gradient-to-t from-emerald-700 to-emerald-300 transition-all" style={{ height: month.income ? `${Math.max(5, (month.income / maxFlow) * 100)}%` : '0%' }} />
                  <div title={`${copy.expense}: ${money(month.expense, lang)}`} className="w-[clamp(8px,30%,18px)] min-h-0 rounded-t-sm bg-gradient-to-t from-rose-700 to-rose-300 transition-all" style={{ height: month.expense ? `${Math.max(5, (month.expense / maxFlow) * 100)}%` : '0%' }} />
                </div>
                <span className="mb-2 truncate text-[10px] text-white/45">{month.label}</span>
              </div>
            ))}
          </div>
          <div className="mt-5 rounded-xl border border-white/[0.06] bg-black/20 p-3 text-[10px] leading-5 text-white/45">
            {isAr ? 'المخطط يعرض القيود الفعلية؛ لا يقدّر مبيعات ولا يضم طلبات المعاينة.' : 'Chart uses recorded entries only; it does not forecast sales or include visit requests.'}
          </div>
        </section>
      </div>

      <section className="overflow-hidden rounded-2xl border border-[#2b2b30] bg-[#121214]">
        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-white/[0.08] p-5">
          <div><h3 className="text-sm font-bold text-white">{copy.ledger}</h3><p className="mt-1 text-[10px] text-white/40">{isAr ? `${visibleEntries.length} قيد في الفترة المختارة` : `${visibleEntries.length} entries in selected period`}</p></div>
          <div className="flex w-full flex-wrap gap-2 sm:w-auto">
            <button type="button" onClick={() => { setStatusFilter(statusFilter === 'posted' ? 'voided' : 'posted'); setVoidingId(null); }} className="h-9 rounded-lg border border-[#353539] px-3 text-[10px] font-semibold text-white/65 transition hover:border-white/50 hover:text-white">{statusFilter === 'posted' ? copy.showVoided : copy.showPosted}</button>
            <input type="search" value={search} onChange={(event) => setSearch(event.target.value)} placeholder={copy.search} className="h-9 min-w-48 flex-1 rounded-lg border border-[#353539] bg-[#09090a] px-3 text-xs text-white outline-none focus:border-[#ed1c24] sm:w-64 sm:flex-none" />
            <select aria-label={isAr ? 'تصفية حسب نوع العملية' : 'Filter by transaction type'} value={filter} onChange={(event) => setFilter(event.target.value as FinanceFilter)} className="h-9 rounded-lg border border-[#353539] bg-[#09090a] px-3 text-xs text-white outline-none focus:border-[#ed1c24]"><option value="all">{copy.all}</option><option value="income">{copy.incomeOnly}</option><option value="expense">{copy.expenseOnly}</option></select>
            <button type="button" onClick={() => downloadEntriesCsv(visibleEntries, cars, isAr)} disabled={!visibleEntries.length} className="inline-flex h-9 items-center gap-2 rounded-lg border border-[#353539] px-3 text-xs font-semibold text-white/70 transition hover:border-white/50 hover:text-white disabled:opacity-40"><Download className="h-3.5 w-3.5" />CSV</button>
          </div>
        </div>

        {visibleEntries.length === 0 ? <div className="p-12 text-center text-sm text-white/40">{copy.empty}</div> : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[900px] text-start text-xs">
              <thead className="bg-white/[0.025] text-[10px] text-white/40"><tr>{[isAr ? 'التاريخ' : 'Date', isAr ? 'النوع والبند' : 'Type & category', isAr ? 'الطرف / السيارة' : 'Party / car', isAr ? 'طريقة الدفع' : 'Payment', isAr ? 'المرجع' : 'Reference', isAr ? 'المبلغ' : 'Amount', isAr ? 'الحالة' : 'Status', ''].map((heading) => <th key={heading} className="px-4 py-3 font-medium">{heading}</th>)}</tr></thead>
              <tbody className="divide-y divide-white/[0.06]">
                {visibleEntries.map((entry) => {
                  const isIncome = entry.type === 'income';
                  return (
                    <tr key={entry.id} className="text-white/75 hover:bg-white/[0.02]">
                      <td dir="ltr" className="px-4 py-4 text-start font-latin tabular-nums text-white/55">{entry.occurredOn}</td>
                      <td className="px-4 py-4"><div className={`flex items-center gap-1.5 font-semibold ${isIncome ? 'text-emerald-200' : 'text-rose-200'}`}>{isIncome ? <ArrowDownLeft className="h-3.5 w-3.5" /> : <ArrowUpRight className="h-3.5 w-3.5" />}{isIncome ? copy.income : copy.expense}</div><div className="mt-1 text-[10px] text-white/45">{categoryTitle(entry.category)}</div></td>
                      <td className="px-4 py-4"><div>{entry.counterparty || '—'}</div>{entry.carId && <div className="mt-1 text-[10px] text-white/40">{cars.find((car) => car.id === entry.carId)?.name || entry.carId}</div>}</td>
                      <td className="px-4 py-4 text-white/55">{paymentLabel(entry.paymentMethod)}</td>
                      <td className="px-4 py-4 font-latin text-white/45">{entry.reference || '—'}</td>
                      <td dir="ltr" className={`px-4 py-4 text-start font-latin font-bold tabular-nums ${isIncome ? 'text-emerald-200' : 'text-rose-200'}`}>{isIncome ? '+' : '−'}{money(entry.amountEgp, lang)}</td>
                      <td className="px-4 py-4"><span className={`rounded-full px-2 py-1 text-[10px] ${entry.status === 'posted' ? 'bg-emerald-500/10 text-emerald-200' : 'bg-white/5 text-white/45'}`}>{entry.status === 'posted' ? copy.posted : copy.voided}</span>{entry.voidReason && <div className="mt-1 max-w-40 truncate text-[9px] text-white/35" title={entry.voidReason}>{entry.voidReason}</div>}</td>
                      <td className="px-4 py-4 text-end">
                        {entry.status === 'voided' ? '—' : voidingId === entry.id ? <div className="flex items-center justify-end gap-2"><input value={voidReason} onChange={(event) => setVoidReason(event.target.value)} maxLength={160} placeholder={copy.voidReason} className="h-8 w-36 rounded border border-[#353539] bg-black px-2 text-[10px] text-white" /><button type="button" disabled={busy || status !== 'ready'} onClick={() => void confirmVoid(entry)} className="rounded bg-rose-500/15 px-2.5 py-2 text-[10px] font-bold text-rose-200 hover:bg-rose-500/25 disabled:opacity-50">{copy.confirmVoid}</button><button type="button" onClick={() => { setVoidingId(null); setVoidReason(''); }} className="px-2 py-2 text-[10px] text-white/50">{copy.cancel}</button></div> : <button type="button" disabled={status !== 'ready'} onClick={() => setVoidingId(entry.id)} className="rounded border border-white/10 px-2.5 py-2 text-[10px] text-white/45 transition hover:border-rose-400/40 hover:text-rose-200 disabled:opacity-40">{copy.void}</button>}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>
      <p className="text-[10px] leading-5 text-white/35">{isAr ? 'دفتر نقدية إداري لمتابعة الإيرادات والمصروفات، وليس بديلًا عن القيود المحاسبية القانونية أو الضريبية.' : 'Internal cashbook for tracking income and expenses; not a replacement for statutory or tax accounting.'}</p>
    </div>
  );
}
