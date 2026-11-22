import { useMemo, useState } from 'react';
import { ArrowUpLeft, CalendarClock, Check, MessageCircle, Pencil, Plus, Search, UserRound, UsersRound } from 'lucide-react';
import type { CarModel, LangCode } from '../data/cars';
import type { CustomerLead, LeadSource, LeadStage } from '../data/store';

interface CustomerLeadsTabProps {
  leads: CustomerLead[];
  cars: CarModel[];
  lang: LangCode;
  status: 'loading' | 'ready' | 'error';
  onSaveLead: (lead: CustomerLead) => Promise<void>;
}

const STAGES: LeadStage[] = ['new', 'contacted', 'interested', 'visit', 'won', 'lost'];
const SOURCES: LeadSource[] = ['whatsapp', 'phone', 'showroom', 'website', 'referral', 'other'];

function localDateValue() {
  const now = new Date();
  const local = new Date(now.getTime() - now.getTimezoneOffset() * 60_000);
  return local.toISOString().slice(0, 10);
}

function toWhatsappDigits(phone: string) {
  const digits = phone.replace(/\D/g, '');
  if (digits.startsWith('00')) return digits.slice(2);
  if (digits.startsWith('0')) return `20${digits.slice(1)}`;
  return digits;
}

export function CustomerLeadsTab({ leads, cars, lang, status, onSaveLead }: CustomerLeadsTabProps) {
  const isAr = lang === 'ar';
  const copy = isAr ? {
    title: 'متابعة العملاء', subtitle: 'سجل يدوي لمتابعة الاستفسارات القادمة من واتساب، الهاتف، المعرض والموقع.', add: 'إضافة عميل', search: 'ابحث بالاسم أو الهاتف أو السيارة…', all: 'كل المراحل', name: 'اسم العميل', phone: 'رقم الهاتف', car: 'السيارة المهتم بها', noCar: 'لم يحدد سيارة', source: 'مصدر الاستفسار', stage: 'المرحلة', followUp: 'موعد المتابعة', notes: 'ملاحظات الفريق', create: 'حفظ العميل', update: 'حفظ التعديلات', cancel: 'إلغاء', edit: 'تعديل', whatsapp: 'فتح واتساب', active: 'متابعة مفتوحة', today: 'متابعات اليوم', qualified: 'مهتمون / معاينة', closed: 'نتائج مغلقة', empty: 'لا يوجد عملاء في هذه المرحلة.', saving: 'جارٍ الحفظ…', saved: 'تم حفظ العميل.', error: 'تعذر الحفظ. تأكدي من قواعد Firebase واتصال الإنترنت.', loading: 'جارٍ تحميل سجل العملاء…', rules: 'تعذر تحميل سجل العملاء من Firebase. تحققي من اتصال الإنترنت وصلاحيات حساب الأدمن ثم أعيدي تحميل الصفحة.', privacy: 'بيانات العملاء خاصة بلوحة الإدارة فقط.', manual: 'أضيفي العميل يدويًا بعد وصول الاستفسار؛ الموقع لا يقرأ رسائل واتساب تلقائيًا.', overdue: 'متأخرة', dueToday: 'اليوم', upcoming: 'لاحقًا', noFollowUp: 'بدون موعد',
    stages: { new: 'جديد', contacted: 'تم التواصل', interested: 'مهتم', visit: 'موعد معاينة', won: 'تم البيع', lost: 'مغلق / لم يتم' },
    sources: { whatsapp: 'واتساب', phone: 'الهاتف', showroom: 'زيارة المعرض', website: 'الموقع', referral: 'ترشيح', other: 'أخرى' },
  } : {
    title: 'Customer follow-up', subtitle: 'A manual lead tracker for enquiries from WhatsApp, phone, the showroom, and the website.', add: 'Add customer', search: 'Search name, phone, or car…', all: 'All stages', name: 'Customer name', phone: 'Phone number', car: 'Interested car', noCar: 'No car selected', source: 'Enquiry source', stage: 'Stage', followUp: 'Next follow-up', notes: 'Team notes', create: 'Save customer', update: 'Save changes', cancel: 'Cancel', edit: 'Edit', whatsapp: 'Open WhatsApp', active: 'Open leads', today: 'Follow-ups today', qualified: 'Interested / visits', closed: 'Closed outcomes', empty: 'No customers in this stage.', saving: 'Saving…', saved: 'Customer saved.', error: 'Could not save. Check Firebase rules and your connection.', loading: 'Loading customer records…', rules: 'Customer records could not be loaded from Firebase. Check your connection and admin access, then reload the page.', privacy: 'Customer details are admin-only.', manual: 'Add a customer after an enquiry arrives; the site does not read WhatsApp messages automatically.', overdue: 'Overdue', dueToday: 'Today', upcoming: 'Upcoming', noFollowUp: 'No follow-up',
    stages: { new: 'New', contacted: 'Contacted', interested: 'Interested', visit: 'Visit scheduled', won: 'Won', lost: 'Closed / lost' },
    sources: { whatsapp: 'WhatsApp', phone: 'Phone', showroom: 'Showroom', website: 'Website', referral: 'Referral', other: 'Other' },
  };

  const [editing, setEditing] = useState<CustomerLead | null>(null);
  const [filter, setFilter] = useState<'all' | LeadStage>('all');
  const [search, setSearch] = useState('');
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState('');

  const today = localDateValue();
  const activeLeads = leads.filter((lead) => lead.stage !== 'won' && lead.stage !== 'lost');
  const dueToday = activeLeads.filter((lead) => lead.nextFollowUp && lead.nextFollowUp <= today).length;
  const qualified = activeLeads.filter((lead) => lead.stage === 'interested' || lead.stage === 'visit').length;
  const closed = leads.filter((lead) => lead.stage === 'won' || lead.stage === 'lost').length;

  const visibleLeads = useMemo(() => {
    const term = search.trim().toLocaleLowerCase();
    return leads
      .filter((lead) => filter === 'all' || lead.stage === filter)
      .filter((lead) => {
        if (!term) return true;
        const car = cars.find((model) => model.id === lead.carId)?.name || '';
        return [lead.name, lead.phone, lead.notes, car].some((item) => item?.toLocaleLowerCase().includes(term));
      })
      .sort((a, b) => (a.nextFollowUp || '9999').localeCompare(b.nextFollowUp || '9999') || b.updatedAt.localeCompare(a.updatedAt));
  }, [leads, cars, filter, search]);

  const emptyDraft = (): CustomerLead => ({
    id: `lead-${crypto.randomUUID()}`,
    name: '',
    phone: '',
    source: 'whatsapp',
    stage: 'new',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  });

  const save = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!editing) return;
    setBusy(true);
    setMessage('');
    try {
      await onSaveLead({
        ...editing,
        name: editing.name.trim(),
        phone: editing.phone.trim(),
        notes: editing.notes?.trim() || '',
        updatedAt: new Date().toISOString(),
      });
      setEditing(null);
      setMessage(copy.saved);
    } catch {
      setMessage(copy.error);
    } finally {
      setBusy(false);
    }
  };

  const updateStage = async (lead: CustomerLead, stage: LeadStage) => {
    setBusy(true);
    setMessage('');
    try {
      await onSaveLead({ ...lead, stage, updatedAt: new Date().toISOString() });
      setMessage(copy.saved);
    } catch {
      setMessage(copy.error);
    } finally {
      setBusy(false);
    }
  };

  const followUpLabel = (date?: string) => {
    if (!date) return copy.noFollowUp;
    if (date < today) return `${copy.overdue} · ${date}`;
    if (date === today) return `${copy.dueToday} · ${date}`;
    return `${copy.upcoming} · ${date}`;
  };

  const stageStyle = (stage: LeadStage) => stage === 'won'
    ? 'border-emerald-400/20 bg-emerald-400/10 text-emerald-200'
    : stage === 'lost'
      ? 'border-white/10 bg-white/[0.04] text-white/40'
      : stage === 'visit'
        ? 'border-sky-400/20 bg-sky-400/10 text-sky-200'
        : stage === 'interested'
          ? 'border-amber-400/20 bg-amber-400/10 text-amber-200'
          : 'border-[#ed1c24]/20 bg-[#ed1c24]/10 text-[#ff9296]';

  return (
    <div className="mt-8 space-y-6">
      <header className="flex flex-wrap items-end justify-between gap-4 border-b border-[#252528] pb-5">
        <div>
          <span className="font-latin text-[10px] font-bold tracking-[0.2em] text-[#ed1c24]">LANE · CUSTOMER DESK</span>
          <h2 className="mt-2 text-2xl font-bold text-[#f5f3ef]">{copy.title}</h2>
          <p className="mt-2 max-w-3xl text-xs leading-6 text-[#a8a39d]">{copy.subtitle}</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <span className="inline-flex items-center gap-2 rounded-full border border-emerald-500/20 bg-emerald-500/[0.06] px-3 py-2 text-[10px] text-emerald-100"><UserRound className="h-3.5 w-3.5" />{copy.privacy}</span>
          <button type="button" disabled={status !== 'ready'} onClick={() => { setMessage(''); setEditing(emptyDraft()); }} className="inline-flex h-10 items-center gap-2 rounded-lg bg-[#ed1c24] px-4 text-xs font-bold text-white transition hover:bg-[#cf1720] disabled:cursor-not-allowed disabled:opacity-40"><Plus className="h-4 w-4" />{copy.add}</button>
        </div>
      </header>

      {status !== 'ready' && <div role={status === 'error' ? 'alert' : 'status'} className={`rounded-xl border px-4 py-3 text-xs leading-6 ${status === 'error' ? 'border-amber-400/25 bg-amber-400/[0.06] text-amber-100' : 'border-white/10 bg-white/[0.03] text-white/55'}`}>{status === 'loading' ? copy.loading : copy.rules}</div>}

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {[
          { label: copy.active, value: activeLeads.length, icon: UsersRound, tone: 'text-white' },
          { label: copy.today, value: dueToday, icon: CalendarClock, tone: dueToday ? 'text-amber-200' : 'text-white' },
          { label: copy.qualified, value: qualified, icon: Check, tone: 'text-sky-200' },
          { label: copy.closed, value: closed, icon: ArrowUpLeft, tone: 'text-emerald-200' },
        ].map((item) => {
          const Icon = item.icon;
          return <div key={item.label} className="rounded-2xl border border-white/[0.08] bg-gradient-to-br from-white/[0.045] to-[#121214] p-4"><div className="flex items-center justify-between text-[11px] text-white/45"><span>{item.label}</span><Icon className={`h-4 w-4 ${item.tone}`} /></div><strong className={`mt-2 block font-latin text-2xl tabular-nums ${item.tone}`}>{item.value}</strong></div>;
        })}
      </div>

      {editing && (
        <form onSubmit={(event) => void save(event)} className="rounded-2xl border border-[#ed1c24]/35 bg-[#121214] p-5 sm:p-6">
          <div className="mb-4 flex items-center justify-between gap-3"><h3 className="text-sm font-bold text-white">{leads.some((lead) => lead.id === editing.id) ? copy.edit : copy.add}</h3><button type="button" onClick={() => setEditing(null)} className="text-xs text-white/50 hover:text-white">{copy.cancel}</button></div>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            <label className="text-[11px] text-white/60">{copy.name}<input autoFocus required maxLength={120} value={editing.name} onChange={(event) => setEditing({ ...editing, name: event.target.value })} className="mt-1.5 h-10 w-full rounded-lg border border-[#353539] bg-[#09090a] px-3 text-xs text-white outline-none focus:border-[#ed1c24]" /></label>
            <label className="text-[11px] text-white/60">{copy.phone}<input required minLength={7} maxLength={30} type="tel" value={editing.phone} onChange={(event) => setEditing({ ...editing, phone: event.target.value })} className="mt-1.5 h-10 w-full rounded-lg border border-[#353539] bg-[#09090a] px-3 font-latin text-xs text-white outline-none focus:border-[#ed1c24]" /></label>
            <label className="text-[11px] text-white/60">{copy.car}<select value={editing.carId || ''} onChange={(event) => setEditing({ ...editing, carId: event.target.value || undefined })} className="mt-1.5 h-10 w-full rounded-lg border border-[#353539] bg-[#09090a] px-3 text-xs text-white outline-none focus:border-[#ed1c24]"><option value="">{copy.noCar}</option>{cars.map((car) => <option key={car.id} value={car.id}>{car.name}</option>)}</select></label>
            <label className="text-[11px] text-white/60">{copy.source}<select value={editing.source} onChange={(event) => setEditing({ ...editing, source: event.target.value as LeadSource })} className="mt-1.5 h-10 w-full rounded-lg border border-[#353539] bg-[#09090a] px-3 text-xs text-white outline-none focus:border-[#ed1c24]">{SOURCES.map((source) => <option key={source} value={source}>{copy.sources[source]}</option>)}</select></label>
            <label className="text-[11px] text-white/60">{copy.stage}<select value={editing.stage} onChange={(event) => setEditing({ ...editing, stage: event.target.value as LeadStage })} className="mt-1.5 h-10 w-full rounded-lg border border-[#353539] bg-[#09090a] px-3 text-xs text-white outline-none focus:border-[#ed1c24]">{STAGES.map((stage) => <option key={stage} value={stage}>{copy.stages[stage]}</option>)}</select></label>
            <label className="text-[11px] text-white/60">{copy.followUp}<input type="date" value={editing.nextFollowUp || ''} onChange={(event) => setEditing({ ...editing, nextFollowUp: event.target.value || undefined })} className="mt-1.5 h-10 w-full rounded-lg border border-[#353539] bg-[#09090a] px-3 font-latin text-xs text-white outline-none focus:border-[#ed1c24]" /></label>
            <label className="text-[11px] text-white/60 sm:col-span-2 lg:col-span-3">{copy.notes}<textarea maxLength={600} rows={2} value={editing.notes || ''} onChange={(event) => setEditing({ ...editing, notes: event.target.value })} className="mt-1.5 w-full resize-y rounded-lg border border-[#353539] bg-[#09090a] px-3 py-2 text-xs leading-5 text-white outline-none focus:border-[#ed1c24]" /></label>
          </div>
          <div className="mt-4 flex flex-wrap items-center justify-between gap-3"><p role="status" className="text-[11px] text-white/50">{message || copy.manual}</p><button type="submit" disabled={busy || status !== 'ready'} className="h-10 rounded-lg bg-[#ed1c24] px-5 text-xs font-bold text-white hover:bg-[#cf1720] disabled:opacity-50">{busy ? copy.saving : leads.some((lead) => lead.id === editing.id) ? copy.update : copy.create}</button></div>
        </form>
      )}

      <section className="overflow-hidden rounded-2xl border border-[#2b2b30] bg-[#121214]">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/[0.08] p-4 sm:p-5">
          <div className="relative min-w-52 flex-1 sm:max-w-sm"><Search className="pointer-events-none absolute start-3 top-3 h-3.5 w-3.5 text-white/35" /><input type="search" value={search} onChange={(event) => setSearch(event.target.value)} placeholder={copy.search} className="h-10 w-full rounded-lg border border-[#353539] bg-[#09090a] ps-9 pe-3 text-xs text-white outline-none focus:border-[#ed1c24]" /></div>
          <select aria-label={copy.stage} value={filter} onChange={(event) => setFilter(event.target.value as 'all' | LeadStage)} className="h-10 rounded-lg border border-[#353539] bg-[#09090a] px-3 text-xs text-white outline-none focus:border-[#ed1c24]"><option value="all">{copy.all}</option>{STAGES.map((stage) => <option key={stage} value={stage}>{copy.stages[stage]}</option>)}</select>
        </div>
        {visibleLeads.length === 0 ? <div className="p-12 text-center text-sm text-white/40">{copy.empty}</div> : (
          <div className="grid gap-3 p-4 sm:grid-cols-2 xl:grid-cols-3">
            {visibleLeads.map((lead) => {
              const carName = cars.find((car) => car.id === lead.carId)?.name;
              const due = lead.nextFollowUp && lead.stage !== 'won' && lead.stage !== 'lost' && lead.nextFollowUp <= today;
              const waDigits = toWhatsappDigits(lead.phone);
              return (
                <article key={lead.id} className="rounded-xl border border-white/[0.08] bg-[#0d0d0f] p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0"><h3 className="truncate text-sm font-bold text-white">{lead.name}</h3><a dir="ltr" href={`tel:${lead.phone}`} className="mt-1 inline-block font-latin text-xs text-white/50 hover:text-white">{lead.phone}</a></div>
                    <span className={`shrink-0 rounded-full border px-2.5 py-1 text-[10px] font-semibold ${stageStyle(lead.stage)}`}>{copy.stages[lead.stage]}</span>
                  </div>
                  <div className="mt-4 space-y-2 text-[11px] text-white/50">
                    <div className="flex justify-between gap-3"><span>{copy.sources[lead.source]}</span><span className="truncate text-end text-white/75">{carName || copy.noCar}</span></div>
                    <div className={`flex items-center gap-1.5 ${due ? 'font-semibold text-amber-200' : ''}`}><CalendarClock className="h-3.5 w-3.5 shrink-0" />{followUpLabel(lead.nextFollowUp)}</div>
                    {lead.notes && <p className="line-clamp-2 border-t border-white/[0.06] pt-2 leading-5 text-white/40">{lead.notes}</p>}
                  </div>
                  <div className="mt-4 flex flex-wrap items-center justify-between gap-2 border-t border-white/[0.06] pt-3">
                    <select aria-label={`${copy.stage}: ${lead.name}`} disabled={busy || status !== 'ready'} value={lead.stage} onChange={(event) => void updateStage(lead, event.target.value as LeadStage)} className="h-8 min-w-0 flex-1 rounded-lg border border-[#353539] bg-[#121214] px-2 text-[10px] text-white/70 outline-none focus:border-[#ed1c24]">{STAGES.map((stage) => <option key={stage} value={stage}>{copy.stages[stage]}</option>)}</select>
                    <button type="button" disabled={status !== 'ready'} onClick={() => { setMessage(''); setEditing({ ...lead }); }} aria-label={`${copy.edit}: ${lead.name}`} className="inline-flex h-8 items-center gap-1.5 rounded-lg border border-white/10 px-2.5 text-[10px] text-white/60 hover:border-white/30 hover:text-white"><Pencil className="h-3 w-3" />{copy.edit}</button>
                    <a target="_blank" rel="noopener noreferrer" href={`https://wa.me/${waDigits}`} aria-label={`${copy.whatsapp}: ${lead.name}`} className="inline-flex h-8 items-center gap-1.5 rounded-lg bg-emerald-500/10 px-2.5 text-[10px] font-semibold text-emerald-200 hover:bg-emerald-500/20"><MessageCircle className="h-3.5 w-3.5" />{copy.whatsapp}</a>
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </section>
      <p className="text-[10px] leading-5 text-white/35">{copy.manual}</p>
      {message && !editing && <p role="status" className="text-xs text-emerald-200">{message}</p>}
    </div>
  );
}
