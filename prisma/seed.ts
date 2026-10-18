import { PrismaClient } from '@prisma/client'
import { createHash, randomBytes } from 'crypto'

const db = new PrismaClient()

function hashPassword(pw: string, salt = randomBytes(8).toString('hex')) {
  const h = createHash('sha256').update(`${salt}:${pw}`).digest('hex')
  return `${salt}:${h}`
}

async function main() {
  console.log('پاک‌سازی دیتابیس...')
  await db.session.deleteMany()
  await db.eventImage.deleteMany()
  await db.comment.deleteMany()
  await db.timelineEvent.deleteMany()
  await db.document.deleteMany()
  await db.worker.deleteMany()
  await db.contractInfo.deleteMany()
  await db.contactEntry.deleteMany()
  await db.projectAccess.deleteMany()
  await db.project.deleteMany()
  await db.user.deleteMany()
  await db.newsItem.deleteMany()
  await db.requestLead.deleteMany()
  await db.official.deleteMany()
  await db.blogPost.deleteMany()
  await db.referenceItem.deleteMany()
  await db.referenceMessage.deleteMany()
  await db.paymentReceipt.deleteMany()
  await db.projectArchive.deleteMany()

  console.log('ایجاد کاربران...')
  const admin = await db.user.create({
    data: {
      username: 'admin',
      passwordHash: hashPassword('12345678'),
      fullName: 'مهندس حسین مجرد',
      role: 'admin',
    },
  })
  const executor = await db.user.create({
    data: {
      username: 'mojri',
      passwordHash: hashPassword('12345678'),
      fullName: 'مهندس امیر کاظمی',
      role: 'executor',
    },
  })
  const owner = await db.user.create({
    data: {
      username: 'malek',
      passwordHash: hashPassword('12345678'),
      fullName: 'جناب آقای فرهادی',
      role: 'owner',
    },
  })
  const supervisor = await db.user.create({
    data: {
      username: 'nazer',
      passwordHash: hashPassword('12345678'),
      fullName: 'مهندس مهدی رستمی',
      role: 'supervisor',
    },
  })
  const contractor = await db.user.create({
    data: {
      username: 'peymankar',
      passwordHash: hashPassword('12345678'),
      fullName: 'مهندس سعید زمانی',
      role: 'contractor',
    },
  })
  // مالک و ناظر پروژهٔ دوم (دهم شریع) — برای نمایش تفکیک پروژه در داشبورد
  const owner2 = await db.user.create({
    data: {
      username: 'malek2',
      passwordHash: hashPassword('12345678'),
      fullName: 'جناب آقای صادق هاشمیان',
      role: 'owner',
    },
  })
  const supervisor2 = await db.user.create({
    data: {
      username: 'nazer2',
      passwordHash: hashPassword('12345678'),
      fullName: 'مهندس فرزاد توکلی',
      role: 'supervisor',
    },
  })

  console.log('ایجاد پروژه‌ها...')
  const anvari = await db.project.create({
    data: {
      slug: 'anvari-8',
      title: 'آپارتمان مسکونی خیابان انوری',
      subtitle: '۸ واحدی — برج مدرن با معماری خاص',
      category: 'completed',
      status: 'تکمیل‌شده — پایان‌کار اخذ شد',
      location: 'مشهد، خیابان انوری',
      area: '۴٬۲۰۰ متر مربع زیربنا',
      year: '۱۴۰۱–۱۴۰۲',
      progress: 100,
      description:
        'برج مدرن ۸ واحدی خیابان انوری با معماری خاص و نگاه معاصر به فضای شهری مشهد طراحی و اجرا شد. تراز منحنی نما، قاب‌های عمودی روبشی و ترکیب سنگ با پروفیل آلومینیوم، هویتی متمایز به این ساختمان داده است. هر واحد با پلان باز، تراس اختصاصی و نورگیری سه‌جانب طراحی شده و زیربنای کل پروژه ۴٬۲۰۰ متر مربع است. اجرای اسکلت بتنی، دیوارچینی هبلکس، تاسیسات مکانیک و برق و نما با تیم داخلی گروه انجام و در زمان‌بندی تعهدشده تحویل گردید.',
      coverImage: '/images/tower-1.jpg',
      gallery: JSON.stringify(['/images/tower-2.jpg', '/images/tower-3.jpg', '/images/facade-1.jpg', '/images/apt-2.jpg']),
      startDate: '۱۴۰۱/۰۴',
      endDate: '۱۴۰۲/۱۰',
      order: 1,
    },
  })

  const namjou = await db.project.create({
    data: {
      slug: 'namjou-6',
      title: 'آپارتمان مسکونی خیابان نامجو',
      subtitle: '۶ واحدی — پلان‌های باز و نور طبیعی',
      category: 'completed',
      status: 'تکمیل‌شده',
      location: 'مشهد، خیابان نامجو',
      area: '۲٬۸۰۰ متر مربع زیربنا',
      year: '۱۴۰۲–۱۴۰۳',
      progress: 100,
      description:
        'مجموعه مسکونی ۶ واحدی خیابان نامجو با تمرکز بر حداکثر استفاده از نور طبیعی و پلان‌های باز طراحی شد. آپارتمان‌های دوبلکس با ارتفاع سقف ۳٫۲ متر، پنجره‌های دوجداره بزرگ و مشاعات کم‌هزینه (راه‌پله بهینه و آسانسور کم‌مصرف) از ویژگی‌های این پروژه است. در فاز اجرا از بلوک هبلکس برای دیوارهای داخلی و عایق رطوبتی دوباند در سطوح مرطوب استفاده شد که مصرف انرژی واحدها را به‌طور محسوسی کاهش داده است.',
      coverImage: '/images/apt-3.jpg',
      gallery: JSON.stringify(['/images/apt-4.jpg', '/images/facade-2.jpg']),
      startDate: '۱۴۰۲/۰۲',
      endDate: '۱۴۰۳/۰۸',
      order: 2,
    },
  })

  const koohsangi = await db.project.create({
    data: {
      slug: 'koohsangi-5',
      title: 'آپارتمان مسکونی خیابان کوهسنگی',
      subtitle: '۵ واحدی — نمای مینیمال و حیاط خلوت',
      category: 'completed',
      status: 'تکمیل‌شده',
      location: 'مشهد، خیابان کوهسنگی',
      area: '۲٬۱۰۰ متر مربع زیربنا',
      year: '۱۴۰۲–۱۴۰۳',
      progress: 100,
      description:
        'پروژه مسکونی ۵ واحدی کوهسنگی با نمای مینیمال، ترکیب آجر نسوز و بتن اکسپوز اجرا شده است. تمرکز طراحی بر ایجاد حیاط خلوت برای واحدهای طبقه همکف و تراس‌های عمودی سبز بوده است. پروژه شامل یک واحد دوبلکس روباش با تراس اختصاصی ۶۰ متری و چهار واحد تک‌طبقه با پارکینگ و انبار مستقل است. کل ساخت در ۱۸ ماه و با کنترل کیفیت مرحله‌ای بتن و مصالح انجام پذیرفت.',
      coverImage: '/images/apt-1.jpg',
      gallery: JSON.stringify(['/images/tehran-1.jpg', '/images/facade-1.jpg']),
      startDate: '۱۴۰۲/۰۶',
      endDate: '۱۴۰۳/۱۲',
      order: 3,
    },
  })

  const zeshk12 = await db.project.create({
    data: {
      slug: 'zeshk-villa-12',
      title: 'ویلای کوهستانی زشک ۱۲',
      subtitle: 'فضایی لاکچری با مناظر ابدی بر فراز دره زشک',
      category: 'completed',
      status: 'تکمیل‌شده',
      location: 'مشهد، دره زشک',
      area: '۷۵۰ متر مربع زیربنا',
      year: '۱۴۰۳',
      progress: 100,
      description:
        'ویلایی لاکچری بر فراز دره زشک، جایی که منظر بی‌پایان رشته‌کوه بینالود تمام فضاهای اصلی را در بر می‌گیرد. این ویلا با دیوارهای سرتاسری شیشه‌ای سمت دره، سقف تیرآهن اکسپوز و نمای سنگ محلی، این ویلا یک اقامتگاه تمام‌فصل است. شومینه دوطرفه، استخر سرپوشیده با منظر، آشپزخانه جزیره‌ای و سوئیت مهمان مستقل از بخش‌های شاخص آن است. سیستم گرمایش ترکیبی (پکیج + پنل کف) و تهویه بازیاب حرارت، مصرف انرژی را در زمستان‌های سرد کوهستان بهینه می‌کند.',
      coverImage: '/images/villa-z-1.jpg',
      gallery: JSON.stringify(['/images/terr-1.jpg', '/images/terr-2.jpg', '/images/villa-z-2.jpg']),
      startDate: '۱۴۰۳/۰۱',
      endDate: '۱۴۰۳/۱۱',
      forSale: true,
      salePrice: '۱۸٫۵ میلیارد تومان',
      saleDescription: 'ویلای تک‌مالکی آماده تحویل با سند تک‌برگ، استخر سرپوشیده و منظر اختصاصی دره زشک. مناسب سرمایه‌گذاری اقامتگاهی.',
      order: 4,
    },
  })

  const zeshk14 = await db.project.create({
    data: {
      slug: 'zeshk-villa-14',
      title: 'ویلای کوهستانی زشک ۱۴',
      subtitle: 'معماری هم‌خوان با شیب طبیعی زمین',
      category: 'completed',
      status: 'تکمیل‌شده',
      location: 'مشهد، دره زشک',
      area: '۵۵۰ متر مربع زیربنا',
      year: '۱۴۰۳',
      progress: 100,
      description:
        'ویلای کوهستانی زشک ۱۴ با رویکرد حداقلی و هم‌خوانی با توپوگرافی طبیعی زمین طراحی شد؛ حجم ساختمان در دو تراز شیب نشسته و تراس‌های چندطبقه، هر فضا را به منظره متفاوتی از دره متصل می‌کند. مصالح غالب: بتن اکسپوز، چوب ترمووود و شیشه بدون قاب در بازشوهای منظر. سیستم روشنایی خطی مخفی، آشپزخانه اپن و اتاق مستر با روم‌سرویس مستقل از ویژگی‌های اجرایی این پروژه است.',
      coverImage: '/images/villa-z-3.jpg',
      gallery: JSON.stringify(['/images/villa-z-4.jpg', '/images/terr-3.jpg']),
      startDate: '۱۴۰۳/۰۳',
      endDate: '۱۴۰۴/۰۱',
      forSale: true,
      salePrice: '۱۳٫۲ میلیارد تومان',
      saleDescription: 'ویلای ۵۵۰ متری با معماری مدرن، مناسب اقامتگاه یا ویلا شخصی. سند آماده، امکان معاوضه با آپارتمان مشهد.',
      order: 5,
    },
  })

  const kahou = await db.project.create({
    data: {
      slug: 'kahou-villa',
      title: 'ویلای جاده روستای کاهو',
      subtitle: 'فضایی دنج و دور از شلوغی',
      category: 'completed',
      status: 'تکمیل‌شده',
      location: 'مشهد، جاده روستای کاهو',
      area: '۴۰۰ متر مربع زیربنا',
      year: '۱۴۰۳',
      progress: 100,
      description:
        'ویلای دنج کاهو در میان باغ‌ها و دور از شلوغی شهر ساخته شده است؛ فضایی برای آدم‌هایی که دنبال سکوت واقعی‌اند. بدنه اصلی با آجر نسوز سفید و چوب، پلان L شکل دور حیاط مرکزی با حوض و درختان میوه چیده شده است. آلاچیق چوبی، باغچه‌های کشاورزی کوچک و تراس آفتاب‌گیری جنوبی از بخش‌های موردعلاقه مالکان است. اجرای اقتصاد‌یافته با کیفیت بالا، نمونه‌ای از پروژه‌های کم‌هزینه اما باجزئیات‌محور گروه است.',
      coverImage: '/images/villa-k-1.jpg',
      gallery: JSON.stringify(['/images/villa-k-2.jpg', '/images/villa-k-3.jpg']),
      startDate: '۱۴۰۳/۰۵',
      endDate: '۱۴۰۴/۰۲',
      forSale: true,
      salePrice: '۸٫۹ میلیارد تومان',
      saleDescription: 'ویلای باغ‌محور ۴۰۰ متری در روستای کاهو؛ متناسب برای خانواده‌هایی که یک اقامتگاه آخر هفته می‌خواهند.',
      order: 6,
    },
  })

  const torghabe = await db.project.create({
    data: {
      slug: 'torghabe-anjiri-1',
      title: 'ویلای مسکونی طرقبه انجیری ۱',
      subtitle: '۳ واحدی دوبلکس — ۵۰۰ متر زیربنا',
      category: 'in-progress',
      status: 'در حال اجرا — مرحله تاسیسات',
      location: 'مشهد، طرقبه، خیابان انجیری',
      area: '۵۰۰ متر مربع زیربنا',
      year: 'شروع ۱۴۰۴',
      progress: 65,
      description:
        'ویلای مسکونی ۳ واحدی دوبلکس طرقبه انجیری ۱ با ۵۰۰ متر زیربنا در یکی از خوش‌آب‌وهواترین محله‌های طرقبه در حال اجراست. هر واحد دوبلکس با ورودی مستقل، تراس منظر و پارکینگ اختصاصی طراحی شده است. مراحل اخذ مجوزها، تجهیز کارگاه، فنداسیون، اسکلت، بتن‌ریزی سقف و دیوارچینی به‌طور کامل به پایان رسیده و هم‌اکنون پروژه در مرحله تاسیسات (برق و مکانیک) قرار دارد. تمام رویدادها، اسناد و روند اجرای این پروژه به‌صورت شفاف در تایم‌لاین ثبت می‌شود.',
      coverImage: '/images/cons-n-1.jpg',
      gallery: JSON.stringify(['/images/cons-n-2.jpg', '/images/cons-n-3.jpg', '/images/cons-1.jpg']),
      startDate: '۱۴۰۴/۰۲',
      commentsVisibility: 'management',
      order: 7,
    },
  })

  await db.project.createMany({
    data: [
      {
        slug: 'vakilabad-complex',
        title: 'مجتمع مسکونی-اداری وکیل‌آباد',
        subtitle: 'برج ترکیبی ۱۲ طبقه — در فاز مطالعه و اخذ مجوز',
        category: 'future',
        status: 'مطالعه و اخذ مجوز',
        location: 'مشهد، بلوار وکیل‌آباد',
        area: '۹٬۵۰۰ متر مربع (برآورد)',
        year: 'پیش‌بینی شروع ۱۴۰۵',
        progress: 0,
        description:
          'طرح مجتمع مسکونی-اداری وکیل‌آباد در قالب برج ترکیبی با پودیوم تجاری و بلوک اداری در فاز مطالعات امکان‌سنجی و اخذ مجوز قرار دارد. مکان‌یابی این طرح با هدف دسترسی سریع به مرکز شهر و دید به خط آسمانی شمال مشهد انجام شده است. سرمایه‌گذاران علاقه‌مند می‌توانند از بخش مشاوره سرمایه‌گذاری با ما در تماس باشند.',
        coverImage: '/images/tower-3.jpg',
        gallery: '[]',
        order: 8,
      },
      {
        slug: 'ahmadabad-tower',
        title: 'برج اداری-تجاری احمدآباد',
        subtitle: 'طرح پیشنهادی با مشارکت زمین',
        category: 'future',
        status: 'مذاکره مشارکت',
        location: 'مشهد، احمدآباد',
        area: '۶٬۸۰۰ متر مربع (برآورد)',
        year: 'پیش‌بینی شروع ۱۴۰۶',
        progress: 0,
        description:
          'برج اداری-تجاری احمدآباد طرحی بر پایه مشارکت با مالکان زمین است که در فاز مذاکره و جمع‌بندی مشارکت قرار دارد. ترکیب پیشنهادی شامل طبقات اداری هوشمند، سالن همایش و پارکینگ طبقاتی مکانیزه است. مستندات فنی و مالی طرح پس از نهایی شدن قرارداد مشارکت منتشر خواهد شد.',
        coverImage: '/images/facade-2.jpg',
        gallery: '[]',
        order: 9,
      },
    ],
  })

  console.log('ایجاد دسترسی‌ها...')
  await db.projectAccess.createMany({
    data: [
      { userId: executor.id, projectId: torghabe.id },
      { userId: owner.id, projectId: torghabe.id },
      { userId: supervisor.id, projectId: torghabe.id },
      { userId: contractor.id, projectId: torghabe.id },
    ],
  })

  console.log('ایجاد رویدادهای تایم‌لاین (طرقبه انجیری ۱)...')
  const ev = (daysAgo: number, hour = 10) => {
    const d = new Date()
    d.setDate(d.getDate() - daysAgo)
    d.setHours(hour, 0, 0, 0)
    return d
  }

  // رکورد شروع مرحله تاسیسات — نخِ بازِ «در جریان»
  await db.timelineEvent.create({
    data: {
      projectId: torghabe.id,
      date: ev(3),
      category: 'execution',
      kind: 'stage_start',
      stageKey: 'mep',
      stageGroup: 'mep',
      title: 'شروع فاز تاسیسات — لوله‌کشی برق و مکانیک',
      description:
        'پس از تکمیل دیوارچینی، فاز تاسیسات آغاز شد. شاسایی مسیر لوله‌های برق (کانال‌گذاری عمودی و افقی) مطابق نقشه‌های برق انجام می‌شود و هم‌زمان لوله‌کشی آب گرم و رفت و برگشت سیستم گرمایش در حال اجراست. پیش‌بینی پایان تاسیسات مکانیک: ۲۵ روز کاری.',
      isReport: true,
      images: JSON.stringify(['/images/mep-1.jpg', '/images/mep-2.jpg']),
      authorId: executor.id,
    },
  })

  const delayEvent = await db.timelineEvent.create({
    data: {
      projectId: torghabe.id,
      date: ev(12),
      category: 'delay',
      kind: 'point',
      title: 'تأخیر کوتاه در تحویل بلوک هبلکس',
      description:
        'سفارش بلوک هبلکس ۱۰ سانتی با ۳ روز تأخیر از کارخانه تحویل شد (صف تولید فصل). دیوارچینی واحد ۲ با یک هفته جابجایی برنامه‌ریزی شد اما با افزودن یک بنای کاری بونس، زمان کلی پروژه بدون تغییر ماند.',
      isReport: false,
      images: '[]',
      authorId: executor.id,
    },
  })

  const visitEvent = await db.timelineEvent.create({
    data: {
      projectId: torghabe.id,
      date: ev(16),
      category: 'visit',
      kind: 'point',
      title: 'بازدید ناظر و تأیید کیفیت دیوارچینی واحدها',
      description:
        'مهندس ناظر در بازدید خود کیفیت اجرای دیوارچینی هبلکس، شاسایی درزها و زهکشی را بررسی و تأیید کردند. تراز و شاقولی دیوارها در محدوده مجاز بود و تنها یک مورد اصلاح جزئی در درز واحد ۱ اعلام شد که همان روز اجرا گردید.',
      isReport: true,
      images: JSON.stringify(['/images/cons-n-3.jpg']),
      authorId: supervisor.id,
    },
  })

  // پایان دیوارچینی — سرِ نخِ بنفشِ نازک‌کاری
  await db.timelineEvent.create({
    data: {
      projectId: torghabe.id,
      date: ev(21),
      category: 'execution',
      kind: 'stage_end',
      stageKey: 'masonry',
      stageGroup: 'finishing',
      title: 'تکمیل دیوارچینی هر ۳ واحد',
      description:
        'دیوارچینی تمام واحدها با بلوک هبلکس ۱۰ سانتی به پایان رسید؛ مصرف کل ۲٬۴۰۰ عدد بلوک و ملات چسب مخصوص AAC. درزها با فایبر و دو لایه ملات گچ پوشانده شد. فضاهای سرویس‌ها با آب‌بندی اولیه آماده تحویل به تاسیسات شدند.',
      isReport: true,
      images: JSON.stringify(['/images/aac-2.jpg', '/images/aac-1.jpg']),
      authorId: executor.id,
    },
  })

  await db.timelineEvent.create({
    data: {
      projectId: torghabe.id,
      date: ev(27),
      category: 'supply',
      kind: 'point',
      title: 'تحویل بلوک هبلکس و مصالح فاز نازک‌کاری',
      description:
        'محموله اول بلوک هبلکس ۱۰ و ۱۵ سانتی (۳ هزار عدد) به کارگاه وارد شد. هم‌زمان گچ، چسب AAC و پروفیل‌های گالوانیزه سقف کاذب سفارش و تحویل گردید.',
      isReport: false,
      images: JSON.stringify(['/images/aac-3.jpg']),
      authorId: executor.id,
    },
  })

  // شروع دیوارچینی
  await db.timelineEvent.create({
    data: {
      projectId: torghabe.id,
      date: ev(30),
      category: 'execution',
      kind: 'stage_start',
      stageKey: 'masonry',
      stageGroup: 'finishing',
      title: 'شروع دیوارچینی با بلوک هبلکس',
      description:
        'دیوارچینی داخلی واحدها با بلوک AAC ۱۰ سانتی آغاز شد. ابتدا چیدمان دیوارهای غیرسازهای طبق نقشه معماری روی سقف ترسیم و سپس پایه‌گذاری از واحدهای جنوبی شروع شد.',
      isReport: true,
      images: JSON.stringify(['/images/aac-3.jpg']),
      authorId: executor.id,
    },
  })

  // پایان سقف
  await db.timelineEvent.create({
    data: {
      projectId: torghabe.id,
      date: ev(48),
      category: 'execution',
      kind: 'stage_end',
      stageKey: 'ceiling',
      stageGroup: 'structure',
      title: 'بتن‌ریزی سقف واحدها — تکمیل مرحله سقف',
      description:
        'بتن‌ریزی سقف هر ۳ واحد با تیرچه پیش‌ساخته و بلوک سفالی انجام شد. حجم کل ریختگی ۳۱۰ مترمکعب بتن C25 با پمپ ۳۶ متری. نمونه‌های بتن برای آزمایشگاه ارسال شد و نتایج ۲۸ روزه همه بالاتر از مقاومت اسمی بودند.',
      isReport: true,
      images: JSON.stringify(['/images/cons-2.jpg']),
      authorId: executor.id,
    },
  })

  // شروع سقف
  await db.timelineEvent.create({
    data: {
      projectId: torghabe.id,
      date: ev(68),
      category: 'execution',
      kind: 'stage_start',
      stageKey: 'ceiling',
      stageGroup: 'structure',
      title: 'شروع کارهای سقف — تیرچه‌گذاری و بلوک‌چینی',
      description:
        'افزودن قالب‌بندی و تیرچه‌گذاری سقف طبقه آخر شروع شد. بلوک‌های سفالی و شبکه میلگرد تیرچه‌ها مطابق نقشه سازه چیده می‌شود.',
      isReport: true,
      images: '[]',
      authorId: executor.id,
    },
  })

  // پایان اسکلت
  await db.timelineEvent.create({
    data: {
      projectId: torghabe.id,
      date: ev(72),
      category: 'execution',
      kind: 'stage_end',
      stageKey: 'skeleton',
      stageGroup: 'structure',
      title: 'تکمیل اسکلت سه‌طبقه (دوبلکس‌ها)',
      description:
        'قاب‌های بتنی تمام طبقات اجرا و شمع‌بندی سقف پایانی انجام شد. مصرف فولاد این مرحله ۹۵ تن بود و کنترل کیفیت جوش و آرماتوربندی طبق جدول بازرسی پیش رفت.',
      isReport: true,
      images: JSON.stringify(['/images/cons-1.jpg', '/images/cons-3.jpg']),
      authorId: executor.id,
    },
  })

  // شروع اسکلت
  await db.timelineEvent.create({
    data: {
      projectId: torghabe.id,
      date: ev(96),
      category: 'execution',
      kind: 'stage_start',
      stageKey: 'skeleton',
      stageGroup: 'structure',
      title: 'شروع اسکلت‌زنی طبقات',
      description:
        'آرماتوربندی و قالب‌بندی ستون‌های طبقه اول آغاز شد. بتن پایه ستون‌ها با بچینگ روی کارگاه تولید و پمپاژ گردید.',
      isReport: true,
      images: '[]',
      authorId: executor.id,
    },
  })

  // پایان فنداسیون
  await db.timelineEvent.create({
    data: {
      projectId: torghabe.id,
      date: ev(101),
      category: 'execution',
      kind: 'stage_end',
      stageKey: 'foundation',
      stageGroup: 'structure',
      title: 'پایان فنداسیون و زیرسازی',
      description:
        'فنداسیون نواری و رادیه بخشی با ۲۲۰ مترمکعب بتن و ۴۰ تن آرماتور به‌طور کامل اجرا شد. زیرسازی با شفت‌زنی و ملات پلاستیکی انجام و آزمایش تراکم خاک تأیید شد.',
      isReport: true,
      images: JSON.stringify(['/images/cons-3.jpg']),
      authorId: executor.id,
    },
  })

  // شروع فنداسیون
  await db.timelineEvent.create({
    data: {
      projectId: torghabe.id,
      date: ev(133),
      category: 'execution',
      kind: 'stage_start',
      stageKey: 'foundation',
      stageGroup: 'structure',
      title: 'شروع فنداسیون — گودبرداری و زیرسازی',
      description:
        'گودبرداری محدوده ساختمان با ماشین‌آلات انجام و خاک رس با خاک‌ریزی مصالح ضعیف جایگزین شد.سپس شفت‌زنی و تسطیح بستر فنداسیون آغاز گردید.',
      isReport: true,
      images: '[]',
      authorId: executor.id,
    },
  })

  await db.timelineEvent.create({
    data: {
      projectId: torghabe.id,
      date: ev(140),
      category: 'decision',
      kind: 'point',
      title: 'تجهیز کارگاه رسمی آغاز شد',
      description:
        'کپسول‌بندی، دفتر کارگاه، انبار مصالح، اسکلت حفاظتی و تجهیزات ایمنی مستقر شد. جلسه توجیهی با سرپرست کارگاه و پیمانکاران جزء برگزار و برنامه کلی ۱۸ ماهه ابلاغ شد.',
      isReport: true,
      images: JSON.stringify(['/images/bp-2.jpg']),
      files: JSON.stringify([{ name: 'برنامه-زمان‌بندی-کلی.jpg', url: '/images/bp-1.jpg' }]),
      authorId: admin.id,
    },
  })

  await db.timelineEvent.create({
    data: {
      projectId: torghabe.id,
      date: ev(158),
      category: 'decision',
      kind: 'point',
      title: 'اخذ مجوز ساخت (پروانه ساختمانی)',
      description:
        'پروانه ساخت ویلا ۳ واحدی با ۵۰۰ متر زیربنا از شهرداری منطقه ۱۰ مشهد صادر شد. نقشه‌های فاز ۲ (اجرایی) شامل معماری، سازه و تاسیسات نهایی و مهر مهندسان ناظر و طراح دریافت گردید.',
      isReport: true,
      images: JSON.stringify(['/images/bp-1.jpg']),
      files: JSON.stringify([{ name: 'پروانه-ساخت-اسکن.jpg', url: '/images/bp-2.jpg' }]),
      authorId: admin.id,
    },
  })

  console.log('ایجاد کامنت‌ها...')
  await db.comment.createMany({
    data: [
      {
        eventId: delayEvent.id,
        authorId: executor.id,
        text: 'با کارخانه هماهنگ شد؛ محموله جایگزین از انبار مشهد ارسال شد و برنامه دیوارچینی واحدها بدون تغییر عمقی ماند.',
        visibility: 'management',
      },
      {
        eventId: visitEvent.id,
        authorId: admin.id,
        text: 'گواهی بازدید ناظر را در پوشه اسناد پرونده نگه داریم؛ برای گزارش ماهانه مالک لازم می‌شود.',
        visibility: 'management',
      },
      {
        eventId: visitEvent.id,
        authorId: executor.id,
        text: 'اصلاح درز واحد ۱ همان روز انجام شد؛ عکس مشروح پیوست است (خط نارنجی محل اصلاح است).',
        image: '/images/cons-3.jpg',
        visibility: 'management',
      },
    ],
  })

  // کامنت‌های هدفمند — مجری از مالک پیگیری می‌خواهد / پیمانکار سوال می‌پرسد / مالک جواب می‌دهد
  const mepEventForComments = await db.timelineEvent.findFirst({
    where: { projectId: torghabe.id, title: { contains: 'تاسیسات' } },
  })
  if (mepEventForComments) {
    await db.comment.createMany({
      data: [
        {
          eventId: mepEventForComments.id,
          authorId: executor.id,
          text: 'آقا فرهادی، لطفاً انتخاب برند پکیج سیستم گرمایش (بوتان یا ایران رادیاتور) را تا آخر هفته مشخص کنید تا پیش‌خرید فصل انجام شود و نرخ فصل سرد نگیریم.',
          visibility: 'owner',
          needsFollowUp: true,
        },
        {
          eventId: mepEventForComments.id,
          authorId: owner.id,
          text: 'سلام؛ بوتان را انتخاب کردم — مدل ۲۴ هزار کالری کندانس. لطفاً فاکتور پیش‌خرید را برای واریز بفرستید.',
          visibility: 'owner',
        },
        {
          eventId: mepEventForComments.id,
          authorId: contractor.id,
          text: 'مسیر لوله‌های رفت و برگشت روی نقشه از شمال آشپزخانه رد می‌شود ولی ستون C-3 در مسیر است؛ می‌شود نقشه بازنگری‌شده را در تب رفرنس‌ها ببینم؟',
          visibility: 'contractor',
        },
        {
          eventId: mepEventForComments.id,
          authorId: executor.id,
          text: 'درست می‌فرمایید؛ مالک امروز نقشه بازنگری‌شده را در تب رفرنس‌ها بارگذاری کرد. لوله‌کشی طبق نسخه ۲ اجرا شود.',
          visibility: 'contractor',
        },
        {
          eventId: mepEventForComments.id,
          authorId: executor.id,
          text: 'هواسان و شاسی کولر سفارش شود تا آخر هفته در کارگاه باشد — تنخواه از حساب تنخواه کارگاه.',
          visibility: 'team',
        },
      ],
    })
  }

  console.log('ایجاد عکس در انتظار تأیید...')
  const mepEvent = await db.timelineEvent.findFirst({
    where: { projectId: torghabe.id, category: 'execution', title: { contains: 'تاسیسات' } },
  })
  if (mepEvent) {
    await db.eventImage.create({
      data: {
        eventId: mepEvent.id,
        url: '/images/mep-3.jpg',
        caption: 'شاسایی مسیر لوله‌های برق واحد ۲ — پیشنهاد مالک برای آرشیو گزارش',
        uploadedById: owner.id,
        status: 'pending',
      },
    })
  }

  console.log('ایجاد اسناد...')
  await db.document.createMany({
    data: [
      {
        projectId: torghabe.id,
        title: 'پروانه ساخت ویلا ۳ واحدی',
        category: 'permit',
        note: 'صادره از شهرداری منطقه ۱۰ مشهد — ۵۰۰ متر زیربنا',
        fileUrl: null,
      },
      {
        projectId: torghabe.id,
        title: 'قرارداد اجرای کار',
        category: 'contract',
        note: 'پیمان مدیریت با گروه آرمان عمران — مبنا آحاد بها',
        fileUrl: null,
      },
      {
        projectId: torghabe.id,
        title: 'نقشه‌های اجرایی فاز ۲',
        category: 'drawing',
        note: 'معماری + سازه + برق + مکانیک — آخرین بازنگری',
        fileUrl: null,
      },
      {
        projectId: torghabe.id,
        title: 'بیمه مسئولیت کارگاه',
        category: 'other',
        note: 'اعتبار تا پایان پروژه',
        fileUrl: null,
      },
      {
        projectId: anvari.id,
        title: 'صدور پایان‌کار و تفکیکی نهایی',
        category: 'completion',
        note: 'پایان‌کار با رضایت کامل مالکان صادر شد',
        fileUrl: null,
      },
      {
        projectId: namjou.id,
        title: 'پایان‌کار آپارتمان نامجو',
        category: 'completion',
        note: 'تحویل واحدها مهر ۱۴۰۳',
        fileUrl: null,
      },
    ],
  })

  console.log('ایجاد کارگران (لیست ساده)...')
  await db.worker.createMany({
    data: [
      { projectId: torghabe.id, fullName: 'استاد حسن رحیمی', job: 'بنّا', phone: '۰۹۱۵۱۱۱۲۲۳۳' },
      { projectId: torghabe.id, fullName: 'علی محمدی', job: 'برق‌کار', phone: '۰۹۳۵۴۴۴۵۵۶۶' },
      { projectId: torghabe.id, fullName: 'رضا کریمی', job: 'آرماتوربند', phone: '۰۹۱۵۳۳۳۴۴۵۵' },
      { projectId: torghabe.id, fullName: 'مجید عباسی', job: 'تاسیسات‌کار (مکانیک)', phone: '۰۹۱۵۷۷۷۸۸۹۹' },
    ],
  })

  console.log('ایجاد وضعیت پیمانکاری...')
  await db.contractInfo.create({
    data: {
      projectId: torghabe.id,
      contractorName: 'گروه ساختمانی آرمان عمران',
      startDate: '۱۴۰۴/۰۲/۱۵',
      endDate: '۱۴۰۵/۰۶/۳۰ (پیش‌بینی)',
      financialStatus: 'balanced',
      totalPaid: '۲٬۴۵۰٬۰۰۰٬۰۰۰ تومان',
      note: 'پرداخت‌ها طبق صورت‌وضعیت ماهانه؛ تنخواه کارگاه هفتگی تسویه می‌شود.',
    },
  })

  console.log('ایجاد دفترچه تماس...')
  const daysAgo = (n: number) => {
    const d = new Date()
    d.setDate(d.getDate() - n)
    return d
  }
  await db.contactEntry.createMany({
    data: [
      {
        name: 'استاد یوسف زارع',
        phone: '09152123400',
        type: 'worker',
        note: 'نقّار و بتن‌ریز؛ کار آزاد می‌پذیرد، سابقه همکاری در سقف انوری.',
        isTemporary: false,
        lastCheckedAt: daysAgo(2),
      },
      {
        name: 'حاج رضا فتحی (فروشگاه فتحی)',
        phone: '09155558877',
        type: 'supplier',
        note: 'عمده‌فروشی آجر و بلوک؛ قیمت رقابتی برای سفارش‌های بالای ۵ هزار عدد.',
        isTemporary: false,
        lastCheckedAt: daysAgo(5),
      },
      {
        name: 'شرکت برق مهر',
        phone: '05138440011',
        type: 'supplier',
        note: 'تأمین کابل و تابلو برق — اعتبار حساب قابل بررسی.',
        isTemporary: false,
        lastCheckedAt: daysAgo(8),
      },
      {
        name: 'مهندس کوروش نادری',
        phone: '09159001234',
        type: 'contractor',
        note: 'پیمانکار جزء نازک‌کاری؛ برای فاز نازک پروژه‌های کوچک.',
        isTemporary: false,
        lastCheckedAt: daysAgo(6),
      },
      {
        name: 'استاد قربان حسینی',
        phone: '09361112233',
        type: 'worker',
        note: 'گچ‌کار و رنگ‌کار — آمده بود برای همکاری موقت؛ اگر پروژه نازک‌کاری داشتیم خبرش کنیم.',
        isTemporary: true,
        lastCheckedAt: daysAgo(12),
      },
      {
        name: 'رضا مرادی (توزیع هبلکس)',
        phone: '09158889977',
        type: 'supplier',
        note: 'خودش معرفی شد؛ ارسال از کارخانه سبز. برای سفارش بعدی چک شود.',
        isTemporary: true,
        lastCheckedAt: daysAgo(20),
      },
      {
        name: 'استاد صادق خلیل‌زاده',
        phone: '09151234567',
        type: 'worker',
        note: 'سفت‌کاری و شاسایی؛ دو روز در کارگاه زشک ۱۴ همکاری کرد.',
        isTemporary: true,
        lastCheckedAt: daysAgo(24),
      },
    ],
  })

  /* ==================================================================
   * پروژه دوم در حال اجرا — ویلای دهم شریع
   * هدف: داشبورد مدیر هر دو پروژه فعال را می‌بیند؛ مالک/ناظر فقط پروژه خودش را
   * ================================================================== */
  console.log('ایجاد پروژه دوم در حال اجرا (دهم شریع)...')
  const dahm = await db.project.create({
    data: {
      slug: 'dahm-sharie-villa',
      title: 'ویلای دوبلکس دهم شریع',
      subtitle: 'دو واحدی — ۴۰۰ متر زیربنا',
      category: 'in-progress',
      status: 'در حال اجرا — مرحله اسکلت',
      location: 'مشهد، دهم شریع، خیابان عارف',
      area: '۴۰۰ متر مربع زیربنا',
      year: 'شروع ۱۴۰۴',
      progress: 32,
      description:
        'ویلای دوبلکس دو واحدی دهم شریع با ۴۰۰ متر زیربنا در یکی از محله‌های آرام شمال مشهد در حال اجراست. پروژه با قرارداد مدیریت پیمان (MC) و با اسکلت بتنی اجرا می‌شود. مراحل پروانه، تجهیز کارگاه، گودبرداری و فنداسیون به پایان رسیده و هم‌اکنون فاز اسکلت و آرماتوربندی طبقه همکف در جریان است. گزارش‌های رسمی هر مرحله در تایم‌لاین پروژه برای مالک و ناظر محترم ثبت می‌شود.',
      coverImage: '/images/villa-1.jpg',
      gallery: JSON.stringify(['/images/cons-1.jpg', '/images/cons-2.jpg']),
      startDate: '۱۴۰۴/۰۶',
      commentsVisibility: 'management',
      order: 10,
    },
  })

  await db.projectAccess.createMany({
    data: [
      { userId: owner2.id, projectId: dahm.id },
      { userId: supervisor2.id, projectId: dahm.id },
    ],
  })

  /* رویدادهای تایم‌لاین دهم شریع */
  const dahmFoundationEnd = await db.timelineEvent.create({
    data: {
      projectId: dahm.id,
      date: ev(41),
      category: 'execution',
      kind: 'stage_end',
      stageKey: 'foundation',
      stageGroup: 'structure',
      title: 'پایان فنداسیون و پی‌ریزی',
      description:
        'بیـت ۴۰ سانتی و رینگ‌بیم طبق نقشه سازه بتن‌ریزی شد. نمونه‌های بتن برای آزمایش مقاومت به آزمایشگاه ارسال شد و پاسخ اولیه در حد مورد انتظار نقشه (C25) بود. سطح پی پس از آب‌بندی، برای شروع آرماتوربندی ستون‌ها آماده است.',
      isReport: true,
      images: JSON.stringify(['/images/cons-1.jpg']),
      authorId: executor.id,
    },
  })
  void dahmFoundationEnd

  await db.timelineEvent.create({
    data: {
      projectId: dahm.id,
      date: ev(48),
      category: 'execution',
      kind: 'stage_start',
      stageKey: 'foundation',
      stageGroup: 'structure',
      title: 'شروع گودبرداری و فنداسیون',
      description:
        'گودبرداری با عمق ۲/۸ متر انجام و خاک‌های اضافه به محل دپو منتقل شد. زیرسازی بستر و کوباژ شمع‌های پیش‌ساخته آغاز شد. مدت پیش‌بینی‌شده فاز فنداسیون: ۱۰ روز کاری.',
      isReport: true,
      authorId: executor.id,
    },
  })

  const dahmConcrete = await db.timelineEvent.create({
    data: {
      projectId: dahm.id,
      date: ev(15),
      category: 'execution',
      kind: 'point',
      title: 'بتن‌ریزی ستون‌های طبقه همکف',
      description:
        'بتن‌ریزی ۱۲ ستون طبقه همکف با بتن آماده C30 انجام شد. قبل از بتن‌ریزی، چیدمان آرماتور و قالب‌بندی توسط مهندس ناظر بازبینی و تأیید شد. عمل‌آوری با پوشش نایلون و آب‌پاشی روزانه انجام می‌شود.',
      isReport: true,
      images: JSON.stringify(['/images/cons-3.jpg']),
      authorId: executor.id,
    },
  })

  await db.timelineEvent.create({
    data: {
      projectId: dahm.id,
      date: ev(58),
      category: 'decision',
      kind: 'point',
      title: 'صدور پروانه ساخت',
      description:
        'پروانه ساخت دو واحدی با زیربنای ۴۰۰ متر از شهرداری منطقه صادر شد. گواهی مالکیت و نقل‌وقبض انجام شده و فایل پروانه در بخش اسناد پروژه بارگذاری شده است.',
      isReport: true,
      files: JSON.stringify([{ name: 'پروانه ساخت دهم شریع.pdf', url: '/uploads/demo-dahm-permit.pdf' }]),
      authorId: admin.id,
    },
  })

  await db.timelineEvent.create({
    data: {
      projectId: dahm.id,
      date: ev(52),
      category: 'execution',
      kind: 'point',
      title: 'تجهیز کارگاه و آوردمان',
      description:
        'دفتر کارگاه، انبار مصالح، سکوی بتن، جان‌گیر محیطی و تابلو معرفی پروژه نصب شد. اتصال برق موقت و آب انجام شد و نیروهای انسانیِ فاز اول بیمه شدند.',
      isReport: true,
      images: JSON.stringify(['/images/cons-2.jpg']),
      authorId: executor.id,
    },
  })

  const dahmVisit = await db.timelineEvent.create({
    data: {
      projectId: dahm.id,
      date: ev(34),
      category: 'visit',
      kind: 'point',
      title: 'بازدید مشترک مالک و ناظر پس از پی‌ریزی',
      description:
        'جناب آقای هاشمیان به همراه مهندس ناظر (مهندس توکلی) از کارگاه بازدید کردند. تراز پایه‌ها و کیفیت اجرای رینگ‌بیم مورد تأیید ناظر قرار گرفت و مالک درخواست ثبت گزارش تصویری منظم‌تر برای فاز اسکلت را مطرح کرد که در همین تایم‌لاین اعمال می‌شود.',
      isReport: true,
      authorId: executor.id,
    },
  })

  await db.timelineEvent.create({
    data: {
      projectId: dahm.id,
      date: ev(26),
      category: 'execution',
      kind: 'stage_start',
      stageKey: 'skeleton',
      stageGroup: 'structure',
      title: 'شروع اسکلت و آرماتوربندی',
      description:
        'فاز اسکلت آغاز شد: آرماتوربندی ستون‌های طبقه همکف مطابق نقشه سازه در حال اجراست. میلگرد مصرفی از کارخانه فولاد خراسان با گواهی کیفیت تأمین می‌شود. پیش‌بینی پایان اسکلت: ۶ هفته.',
      isReport: true,
      images: JSON.stringify(['/images/aac-1.jpg']),
      authorId: executor.id,
    },
  })

  await db.timelineEvent.create({
    data: {
      projectId: dahm.id,
      date: ev(9),
      category: 'supply',
      kind: 'point',
      title: 'تأمین میلگرد فاز اسکلت — ۱۸ تن',
      description:
        'میلگرد آجدار A3 سایز ۱۴ تا ۲۲ (۱۸ تن) از بازار منطقه با قیمت رقابتی تهیه و در انبار کارگاه تحویل شد. گواهی کیفیت کارخانه همراه بار دریافت و در پرونده فنی کارگاه بایگانی شد.',
      isReport: true,
      authorId: executor.id,
    },
  })

  /* پرداخت‌های دهم شریع */
  const dahmPay1 = await db.timelineEvent.create({
    data: {
      projectId: dahm.id,
      date: ev(30),
      category: 'payment',
      title: 'رسید پرداخت ثبت شد',
      description: 'پیش‌پرداخت قرارداد مدیریت پیمان و فاز فنداسیون — واریز به حساب شرکت.',
      isReport: true,
      authorId: owner2.id,
    },
  })
  await db.paymentReceipt.create({
    data: {
      projectId: dahm.id,
      date: ev(30),
      amount: '850000000',
      description: 'پیش‌پرداخت قرارداد مدیریت پیمان و فاز فنداسیون — واریز به حساب شرکت.',
      receiptImage: '/images/mat-1.jpg',
      addedById: owner2.id,
      addedByName: 'جناب آقای صادق هاشمیان',
      timelineEventId: dahmPay1.id,
    },
  })
  const dahmPay2 = await db.timelineEvent.create({
    data: {
      projectId: dahm.id,
      date: ev(5),
      category: 'payment',
      title: 'رسید پرداخت ثبت شد',
      description: 'صورت‌وضعیت شماره ۲ — تأمین میلگرد و اجرای اسکلت طبقه همکف.',
      isReport: true,
      authorId: owner2.id,
    },
  })
  await db.paymentReceipt.create({
    data: {
      projectId: dahm.id,
      date: ev(5),
      amount: '620000000',
      description: 'صورت‌وضعیت شماره ۲ — تأمین میلگرد و اجرای اسکلت طبقه همکف.',
      addedById: owner2.id,
      addedByName: 'جناب آقای صادق هاشمیان',
      timelineEventId: dahmPay2.id,
    },
  })

  /* گفتگوهای دهم شریع */
  await db.comment.createMany({
    data: [
      {
        eventId: dahmConcrete.id,
        authorId: owner2.id,
        text: 'سلام؛ لطفاً برای بتن‌ریزی سقف هم قبل از اجرا دو سه عکس از چیدمان آرماتور برایم بفرستید.',
        visibility: 'owner',
        needsFollowUp: true,
      },
      {
        eventId: dahmConcrete.id,
        authorId: executor.id,
        text: 'سلام و احترام؛ حتماً. روز قبل از بتن‌ریزی سقف، عکس چیدمان آرماتور و قالب‌بندی در همین رویداد ثبت می‌شود.',
        visibility: 'owner',
      },
      {
        eventId: dahmVisit.id,
        authorId: owner2.id,
        text: 'گزارش تصویری منظم را سپاسگزارم؛ لطفاً زمان‌بندی تقریبی پایان اسکلت را هم اعلام کنید.',
        visibility: 'owner',
      },
      {
        eventId: dahmPay2.id,
        authorId: owner2.id,
        text: 'رسید واریز شد؛ لطفاً صورت‌وضعیت تفکیکی فاز میلگرد را برای بررسی بفرستید.',
        visibility: 'owner',
        needsFollowUp: true,
      },
    ],
  })

  /* اسناد، پیمانکاری و نیروها */
  await db.document.createMany({
    data: [
      {
        projectId: dahm.id,
        title: 'پروانه ساخت — دو واحدی دهم شریع',
        category: 'permit',
        note: 'صادرشده از شهرداری منطقه ۸',
        fileUrl: '/uploads/demo-dahm-permit.pdf',
      },
      {
        projectId: dahm.id,
        title: 'نقشه سازه فاز اسکلت',
        category: 'drawing',
        note: 'ویرایش ۲ — مهر مهندس محاسب',
      },
    ],
  })
  await db.contractInfo.create({
    data: {
      projectId: dahm.id,
      contractorName: 'شرکت عمران سپاهان‌سازه (پیمانکار جزء اسکلت)',
      startDate: '۱۴۰۴/۰۶/۰۱',
      endDate: '۱۴۰۵/۰۳/۱۵ (پیش‌بینی)',
      financialStatus: 'creditor',
      totalPaid: '۱٬۴۷۰٬۰۰۰٬۰۰۰ تومان',
      note: 'قرارداد مدیریت پیمان؛ تسویه فاز به فاز پس از تأیید ناظر.',
    },
  })
  await db.worker.createMany({
    data: [
      { projectId: dahm.id, fullName: 'استاد محمد قنبری', job: 'بنّا', phone: '۰۹۱۵۶۵۴۳۲۱۰' },
      { projectId: dahm.id, fullName: 'حسن یوسفی', job: 'آرماتوربند', phone: '۰۹۳۵۱۲۳۴۵۶۷' },
      { projectId: dahm.id, fullName: 'اکبر نوروزی', job: 'قالب‌بند چوبی', phone: '۰۹۱۵۹۸۷۶۵۴۳' },
    ],
  })

  console.log('ایجاد اخبار...')
  await db.newsItem.createMany({
    data: [
      // مناسبتی‌ها — بنر چرخان بالای صفحه اخبار (عکس تمام‌عرض کوتاه + متن روی عکس)
      {
        title: 'تعطیلات رسمی کارگاه‌ها — چهارشنبه و پنجشنبه هفته آینده',
        category: 'occasion',
        excerpt: 'به مناسبت مناسبت رسمی، کارگاه‌های گروه چهارشنبه و پنجشنبه تعطیل است. جمعه زمان‌بندی عادی.',
        content:
          'کارگاه‌های گروه نیکا بنا به مناسبت مناسبت رسمی کشور، چهارشنبه و پنجشنبه هفته آینده تعطیل خواهند بود.\n\nتنخواه و مصالح اضطراری (در صورت نیاز پیمانکاران) با هماهنگی سرپرست کارگاه انجام می‌شود و از جمعه برنامه اجرایی به حالت عادی برمی‌گردد. برای پروژه طرقبه انجیری، فاز تاسیسات بدون وقفه از شنبه ادامه می‌یابد.',
        coverImage: '/images/banners/holiday.jpg',
        date: ev(1, 9),
      },
      {
        title: 'سفر بازدید کارخانه سنگ — بررسی نمونه‌های نما',
        category: 'occasion',
        excerpt: 'تیم فنی گروه از کارخانه سنگ تراورتن در ماهان بازدید کرد؛ نتیجه برای رفرنس نما.',
        content:
          'مهندس کاظمی و تیم فنی گروه با همراهی نماینده مالک، از کارخانه سنگ تراورتن در منطقه ماهان بازدید کردند.\n\nدر این بازدید، نمونه‌های واقعی سنگ کرم نواری (مطابق رفرنس نمای پروژه طرقبه) در ابعاد سفارش بررسی و عیان‌های احتمالی از فاز بُرش تفکیک شد. نتیجه: سفارش نهایی با درز ۲ سانتی و کالیبره‌شده ثبت شد که زمان تحویل را حدود دو هفته جلو می‌اندازد.\n\nگزارش تصویری کامل در رویدادهای تایم‌لاین پروژه ثبت شده است.',
        coverImage: '/images/banners/factory.jpg',
        date: ev(6, 9),
      },
      {
        title: 'تبریک عید نوروز — سال نو ساخت و ساز پر برکت',
        category: 'occasion',
        excerpt: 'گروه ساختمانی نیکا بنا سال نو را به همه مالکان، همکاران و دست‌اندرکاران صنعت ساختمان تبریک می‌گوید.',
        content:
          'به مناسبت آغاز سال جدید، گروه ساختمانی نیکا بنا سال نو را به همه مالکان محترم، پیمانکاران، تأمین‌کنندگان و همکاران عزیز تبریک عرض می‌کند.\n\nکارگاه‌های گروه در روزهای اول نوروز با برنامه سبک و از ۴ فروردین با برنامه کامل فعال هستند. دریافت گزارش‌های تایم‌لاین پروژه‌ها بدون وقفه ادامه دارد و واحد دفتر فنی در ایام تعطیلات نیز پاسخگوی پرسش‌های شماست. سال نو بر شما و خانواده محترمتان پر از سلامتی و بهروزی باشد.',
        coverImage: '/images/banners/norooz.jpg',
        date: ev(3, 9),
      },
      {
        title: 'پیشرفت شاخص: پایان فنداسیون پروژه دهم شریع',
        category: 'occasion',
        excerpt: 'فاز گودبرداری و فنداسیون ویلای دوبلکس دهم شریع کامل شد؛ اسکلت در حال پیشرفت.',
        content:
          'پروژه ویلای دوبلکس دهم شریع از فنداسیون عبور کرد و وارد فاز اسکلت شد.\n\nنمونه‌های بتن فنداسیون با نتیجه مطلوب از آزمایشگاه بازگشت و آرماتوربندی ستون‌های طبقه همکف مطابق برنامه جلو می‌رود. گام بعدی این پروژه، تکمیل اسکلت طبقه همکف و آغاز قالب‌بندی سقف است که گزارش کامل آن در تایم‌لاین پروژه ثبت می‌شود.',
        coverImage: '/images/banners/milestone.jpg',
        date: ev(8, 9),
      },
      {
        title: 'قیمت میلگرد و سیمان بازار مشهد؛ روند این هفته',
        category: 'prices',
        excerpt: 'بررسی نرخ روز میلگرد آجدار، سیمان بندپی و تأثیر آن بر برآورد پروژه‌های در حال اجرا.',
        content:
          'بازار مصالح ساختمانی مشهد این هفته با نوسان ملایم همراه بود. قیمت میلگرد ۱۶ آجدار کارخانه‌های منطقه (نیشابور و یزد) با رشد حدود ۱٫۵ درصد معامله شد و سیمان بندپی نوع ۲ با افزایش محدودی نسبت به هفته گذشته در عمده‌فروشی‌ها عرضه شد.\n\nتوصیه ما برای پروژه‌های در حال اجرا، خرید مرحله‌ای میلگرد بر اساس برنامه‌ریزی فولاد هر فاز است تا از قله‌های قیمتی فصلی فاصله بگیرید. همچنین قرارداد تأمین بتن آماده با فرمول تعدیل شفاف، ریسک نوسان را به حداقل می‌رساند.\n\nدر بخش آجر و بلوک، قیمت‌ها نسبتاً پایدار مانده و پیش‌بینی می‌شود تا پایان فصل جهش قیمتی نداشته باشیم؛ بلوک هبلکس با توجه به نرخ ارسال مستقیم کارخانه همچنان اقتصادی‌ترین گزینه دیوارچینی است.',
        coverImage: '/images/mat-1.jpg',
        date: ev(2, 9),
      },
      {
        title: 'هبلکس یا آجر سفالی؟ مقایسه هزینه نهایی دیوارچینی',
        category: 'prices',
        excerpt: 'قیمت تمام‌شده هر متر مربع دیوار با هبلکس، آجر سفالی و بلوک سیمانی در بازار مشهد.',
        content:
          'با وجود قیمت واحد بالاتر بلوک‌های سبک AAC (هبلکس)، هزینه تمام‌شده هر متر مربع دیوار به دلیل وزن کمتر، ملات چسب کم‌مصرف و سرعت بالاتر اجرا، معمولاً از دیوارچینی سفالی ۸ تا ۱۵ درصد اقتصادی‌تر تمام می‌شود.\n\nدر محاسبه اخیر تیم تدارکات ما برای پروژه ۵۰۰ متری (متراژ متوسط)، صرفه‌جویی نهایی شامل بار کمتر روی تیرها، هزینه جابجایی پایین‌تر و کاهش ضخامت پوشش گچ به‌وضوح مشهود بود.\n\nجزئیات کامل مقایسه فنی و مالی در مطلب وبلاگ «چرا دیوارهای ما را با هبلکس می‌سازیم» آمده است.',
        coverImage: '/images/aac-2.jpg',
        date: ev(9, 9),
      },
      {
        title: 'تغییرات جدید در فرآیند صدور پروانه ساخت شهرداری‌ها',
        category: 'policy',
        excerpt: 'ادغام مراحل صدور پروانه و الکترونیکی شدن بخشی از کنترل‌ها؛ آنچه سازندگان باید بدانند.',
        content:
          'در بخشنامه جدید سازمان شهرداری‌ها، فرآیند صدور پروانه ساخت با ادغام برخی مراحل و حذف رفت‌وبرگشت‌های اداری کوتاه‌تر شده است. بخشی از کنترل‌های فازی به سامانه‌های برخط منتقل شده و مهلت پاسخ به اصلاحات نقشه کاهش یافته است.\n\nنکته مهم برای سازندگان: ارائه اظهارنامه مسئولیت حرفه‌ای مهندس ناظر از ابتدای پرونده الزامی است و تأخیر در آن، صدور پروانه را معلق می‌کند. همچنین برای پروژه‌های زیر ۵۰۰ متر زیربنا مسیر تسریع با تک‌فرم در نظر گرفته شده است.\n\nتوصیه ما به مالکان محترم، اخذ مشاوره پیش از آغاز تا از هزینه‌های پنهان و توقف‌های غیرضروری پرونده جلوگیری شود.',
        coverImage: '/images/bp-2.jpg',
        date: ev(14, 9),
      },
      {
        title: 'سخت‌گیری جدید در بیمه و ایمنی کارگاه‌های ساختمانی',
        category: 'policy',
        excerpt: 'بازرسی کارگاه‌ها برای کنترل کلاه ایمنی، شبکه حفاظ جان‌گیر و بیمه کارگران افزایش یافته است.',
        content:
          'بازرسان کار و رفاه اجتماعی در بازدیدهای اخیر، موارد متعددی از کارگاه‌های بدون بیمه کارگران و بدون تجهیزات حفاظتی را شناسایی کرده‌اند. بر اساس جدیدترین دستورالعمل، مسئولیت مستقیم ایمنی بر عهده کارفرما و مجری است و جرائم عدم رعایت، چشمگیر اعلام شده است.\n\nدر کارگاه‌های گروه نیکا بنا، بیمه تمام نیروها از روز نخست برقرار است، جان‌گیرها در ترازهای باز اسکلت نصب می‌شود و کلاه و کفش ایمنی تحویل همه افراد است. این موارد در چک‌لیست هفتگی سرپرست کارگاه کنترل می‌شود.',
        coverImage: '/images/cons-n-2.jpg',
        date: ev(19, 9),
      },
      {
        title: 'ورود پروژه طرقبه انجیری ۱ به مرحله تاسیسات',
        category: 'company',
        excerpt: 'با تکمیل دیوارچینی هر ۳ واحد، فاز برق و مکانیک ویلا ۵۰۰ متری طرقبه آغاز شد.',
        content:
          'پروژه ویلای مسکونی ۳ واحدی دوبلکس طرقبه انجیری ۱ وارد مرحله تاسیسات شد. مراحل اخذ مجوز، تجهیز کارگاه، فنداسیون، اسکلت، بتن‌ریزی سقف و دیوارچینی به‌طور کامل انجام شده است.\n\nدر این فاز، لوله‌کشی برق (کانال‌گذاری) و لوله‌های آب گرم و رفت‌و برگشت گرمایش در حال اجراست. پیش‌بینی پایان تاسیسات و شروع نازک‌کاری: حدود یک ماه آینده.\n\nگزارش‌های تصویری مراحل مختلف در تایم‌لاین پروژه برای مالکان محترم در دسترس است.',
        coverImage: '/images/mep-1.jpg',
        date: ev(4, 10),
      },
      {
        title: 'صدور پایان‌کار آپارتمان ۸ واحدی انوری',
        category: 'company',
        excerpt: 'پروژه برج مدرن خیابان انوری با تحویل کامل واحدها و اخذ پایان‌کار به چرخه اجرایی گروه بسته شد.',
        content:
          'پروژه آپارتمان مسکونی ۸ واحدی خیابان انوری، پس از ۱۹ ماه اجرا، با رضایت کامل مالکان تحویل و پایان‌کار آن صادر شد. این برج با معماری خاص و قاب‌های عمودی روبشی، از پروژه‌های شاخص پورتفولیوی گروه نیکا بنا است.\n\nدر این پروژه، تمام واحدها با پلان باز و نورگیری سه‌جانب طراحی شدند و زیربنای ۴٬۲۰۰ متری آن با اسکلت بتنی و نمای ترکیبی سنگ و آلومینیوم اجرا شد.\n\nمدارک تفکیکی و پایان‌کار همه واحدها در اختیار مالکان قرار گرفته است.',
        coverImage: '/images/tower-2.jpg',
        date: ev(30, 9),
      },
      {
        title: 'سه ویلا آماده فروش؛ فرصت سرمایه‌گذاری در دامنه بینالود',
        category: 'company',
        excerpt: 'ویلای زشک ۱۲، زشک ۱۴ و کاهو با سند آماده در بخش فروش گروه معرفی شدند.',
        content:
          'بخش فروش گروه نیکا بنا سه ویلا با موقعیت و معماری متفاوت را برای عرضه معرفی کرد: ویلای لاکچری زشک ۱۲ با منظر اختصاصی دره، ویلای زشک ۱۴ با معماری هم‌خوان با شیب طبیعی، و ویلای دنج روستای کاهو در میان باغ‌ها.\n\nاین ملک‌ها با سند تک‌برگ و آماده انتقال عرضه می‌شوند و بازدید حضوری پس از هماهنگی امکان‌پذیر است.\n\nهمکاران علاقه‌مند به همکاری در فروش (معرفی ملک به مشتریان) می‌توانند از بخش «فروش» سایت فرم همکاری را تکمیل کنند؛ پورسانت همکاری پس از انعقاد معامله تسویه می‌شود.',
        coverImage: '/images/terr-1.jpg',
        date: ev(35, 9),
      },
    ],
  })

  console.log('ایجاد مسئولین...')
  await db.official.createMany({
    data: [
      {
        name: 'مهندس حسین مجرد',
        role: 'بنیان‌گذار و مدیرعامل گروه ساختمانی نیکا بنا',
        category: 'company',
        description:
          'بنیان‌گذار گروه با بیش از دو دهه تجربه اجرایی در ساخت‌وساز مشهد؛ طراح و مجری ده‌ها پروژه مسکونی و ویلا در نقاط مختلف شهر. زیر نظر ایشان، رویکرد گروه «کیفیت بدون بهانه» شکل گرفته است: کنترل مرحله‌ای، شفافیت مالی و تحویل به‌موقع.',
        order: 1,
      },
      {
        name: 'مهندس سعید رحیمی',
        role: 'معاون فنی و اجرایی',
        category: 'company',
        description:
          'مسئول هماهنگی فنی کارگاه‌ها، برنامه‌ریزی فازبندی و کنترل کیفیت مصالح. مجری ذی‌نفع فنی پروژه‌های در دست اقدام گروه و ناظر بر قراردادهای پیمانکاران جزء.',
        order: 2,
      },
      {
        name: 'مهندس مریم صادقی',
        role: 'مدیر دفتر فنی و کنترل پروژه',
        category: 'company',
        description:
          'مسئول تدوین صورت‌وضعیت‌ها، کنترل آحاد بها و گزارش‌های ماهانه مالکان. نقطه اتصال مالکان محترم به وضعیت مالی و اجرایی پروژه‌ها.',
        order: 3,
      },
      {
        name: 'نرگس کاظمی',
        role: 'مدیر امور اداری و مالی',
        category: 'company',
        description:
          'مسئول اداری قراردادها، بیمه نیروها و تسویه تنخواه کارگاه‌ها. تمام اسناد پروژه‌ها (مجوز، پایان‌کار، بیمه) تحت مدیریت ایشان آرشیو می‌شود.',
        order: 4,
      },
      {
        name: 'مهندس محمود صمدی',
        role: 'شهردار مشهد',
        category: 'municipal',
        description:
          'مدیریت کلان شهر مشهد؛ متولی اصلی سیاست‌های شهرسازی، صدور پروانه و نظارت بر ساخت‌وساز در محدوده شهر. همکاری گروه با شهرداری در حوزه پرداخت عوارض، اصلاحیات و بازدیدهای مرحله‌ای انجام می‌شود. (معرفی نمونه — به‌روزرسانی با اطلاعات رسمی)',
        order: 5,
      },
      {
        name: 'مهندس فرزانه حسینی',
        role: 'معاون عمران و توسعه شهری شهرداری مشهد',
        category: 'municipal',
        description:
          'مسئول ساختارهای اجرایی عمرانی شهرداری؛ مرجع بررسی پرونده‌های ساخت بزرگ و مجوزهای تخریب دیوار، اسکلت و الحاق. (معرفی نمونه — به‌روزرسانی با اطلاعات رسمی)',
        order: 6,
      },
      {
        name: 'مهندس علیرضا توکلی',
        role: 'رئیس سازمان نظام مهندسی ساختمان خراسان رضوی',
        category: 'provincial',
        description:
          'نهاد ناظر بر حدود ۲۰ هزار مهندس استان؛ صادرکننده پروانه اشتغال و مرجع رسیدگی به تخلفات فنی. مهر مهندسان ناظر و طراح پروژه‌های گروه از طریق این سازمان معتبر است. (معرفی نمونه — به‌روزرسانی با اطلاعات رسمی)',
        order: 7,
      },
      {
        name: 'مهندس بهنام قاسمی',
        role: 'مدیرعامل سازمان نوسازی شهرداری مشهد',
        category: 'municipal',
        description:
          'متولی طرح‌های نوسازی بافتهای فرسوده مشهد؛ مجری برنامه‌های حمایتی بازسازی (وام و تسهیلات). برای پروژه‌های نوسازی منطقه، هماهنگی فنی از طریق این سازمان انجام می‌شود. (معرفی نمونه — به‌روزرسانی با اطلاعات رسمی)',
        order: 8,
      },
    ],
  })

  console.log('ایجاد وبلاگ...')
  await db.blogPost.createMany({
    data: [
      {
        slug: 'heblex-walls',
        title: 'چرا دیوارهای ما را با هبلکس می‌سازیم؟',
        category: 'مصالح',
        excerpt: 'بلوک سبک AAC یا همان هبلکس، ستون فقرات دیوارچینی پروژه‌های ماست؛ مقایسه هزینه، وزن و سرعت اجرا با آجر سفالی.',
        content:
          'هبلکس (بلوک بتنی هواداده-autoclaved) از ماسه، آهک و سیمان و حباب هوای تزریق‌شده تولید می‌شود؛ نتیجه بلوکی است با وزن حدود یک‌پنجم آجر سفالی و مقاومت فشاری کافی برای دیوار داخلی و نما.\n\nسه دلیل اصلی ما برای انتخاب هبلکس:\n۱) سرعت اجرا: بلوک ۶۰ سانتی با ملات چسب نازک، سطح دیوار را صاف تحویل می‌دهد و نیاز به پوشش گچ ضخیم را حذف می‌کند.\n۲) بار مرده کمتر: با سبک شدن دیوارها، ابعاد تیرها و فونداسیون بهینه می‌شود و مصرف فولاد و بتن کاهش می‌یابد.\n۳) عایق بودن: ضریب انتقال حرارت پایین و مقاومت آتش تا ۴ ساعت، هزینه انرژی واحدها را برای همیشه پایین نگه می‌دارد.\n\nنکات اجرایی که رعایت می‌کنیم: چسب مخصوص AAC (نه ملات ماسه-سیمان)، تراز اولین ردیف با دقت کامل، تسلیح درز افقی هر ۳ ردیف در ارتفاع و لنگر فلزی اتصال به ستون‌ها در هر دو ردیف. رعایت همین جزئیات ساده، تفاوت دیواری است که ۲۰ سال بدون ترک می‌ماند با دیواری که سال بعد نیاز به تعمیر دارد.',
        coverImage: '/images/aac-1.jpg',
        readMinutes: 5,
        date: ev(7, 11),
      },
      {
        slug: 'electrical-rough-in',
        title: 'تاسیسات برق استاندارد: کانال‌گذاری قبل از دیوارچینی',
        category: 'برق و تاسیسات',
        excerpt: 'چرا مسیر برق را قبل از گچ‌کوبی می‌کشیم؟ استانداردهای لوله‌کشی، مپ‌ها و ارت که در همه پروژه‌های ما رعایت می‌شود.',
        content:
          'در پروژه‌های گروه، تاسیسات برق پیش از دیوارچینی نهایی مسیرکشی می‌شود (conduit اول، دیوار بعد). روش اجرا:\n\n۱) لوله خم کنتور (conduit) از تابلو به پریزها و کلیدها، داخل دیوار با شاسی‌های مخصوص؛ حداقل شعاع خم ۶ برابر قطر لوله تا کابل بعداً آسیب نبیند.\n۲) ارتفاع استاندارد: کلید و پریز ۱۰۵ و ۳۰ سانتی از کف تمام‌شده؛ تابلو در ارتفاع ۱۶۰ سانتی و دور از مسیر آب.\n۳) ارت مستقل برای هر واحد + باندینگ لوله‌های آب؛ مقاومت ارت با تستر چک می‌شود، نه حدس!\n۴) جعبه تقسیم (مپ) در دیوارهای قابل دسترس، نه داخل ستون یا تیر.\n\nسیم‌کشی پس از گچ با کابل‌های مسی استاندارد (نور ۱٫۵، پریز ۲٫۵، کولر و کابل اصلی ۴ و ۶). تست عایقی قبل از برق‌دار کردن، آخرین مرحله تحویل برق کارگاه است.',
        coverImage: '/images/mep-1.jpg',
        readMinutes: 6,
        date: ev(12, 11),
      },
      {
        slug: 'waterproofing',
        title: 'عایق رطوبتی دوباند؛ جایی که بیشتر خرج‌های پنهان ساختمان شروع می‌شود',
        category: 'ایزولاسیون',
        excerpt: 'دو لایه دوباند + پرایمر در سرویس‌ها، پشت‌بام و تراس؛ روش اجرای درست و تست آب که انجام می‌دهیم.',
        content:
          'خرابی‌های پرهزینه ساختمان به‌ندرت از سازه شروع می‌شوند؛ رطوبت مقصر اصلی است. در همه پروژه‌های ما عایق‌کاری سطوح با پرایمر قیر-گاز و دو لایه دوباند (عمود بر هم) انجام می‌شود.\n\nنکات کلیدی اجرا:\n- پرایمر باید کاملاً خشک شود (حدود ۶ ساعت در هوای معمولی) قبل از لایه اول.\n- لبه‌ها ۲۵ سانتی بالا آمده و روی دیوار با ناودانی یا تسمه فلزی مهار می‌شود.\n- روی‌اندازی، تراز کف سرویس و باتری فلاش تانک با شیب صحیح، قبل از ایزولاسیون چک می‌شود.\n- تست آب ۴۸ ساعته (پر کردن سرویس تا ارتفاع مشخص) پیش از شروع نازک‌کاری الزامی است؛ نتیجه در رویداد پروژه ثبت می‌شود.\n\nدر تراس‌های رو‌باز به‌جای بتن شیب‌دار، از عایق + عایق حرارتی پلی‌استایرن + ملات ارا استفاده می‌کنیم تا رطوبت و حرارت هم‌زمان کنترل شود.',
        coverImage: '/images/mat-2.jpg',
        readMinutes: 5,
        date: ev(18, 11),
      },
      {
        slug: 'ready-mix-concrete',
        title: 'بتن آماده یا مخلوط کارگاهی؟ چرا پمپ و بتن کارخانه‌ای می‌خریم',
        category: 'سازه',
        excerpt: 'کنترل کیفیت بتن C25/C30 در پروژه‌های ما؛ slump، نمونه‌گیری و چرا بتن‌ریزی یک‌شیفته مهم است.',
        content:
          'مقاومت سازه بتنی تا حد زیادی در همان ساعت بتن‌ریزی تعیین می‌شود. ما در فازهای سازه‌ای، بتن آماده از کارخانه‌های دارای گواهی می‌خریم و ریختگی را با پمپ انجام می‌دهیم تا:\n\n- نسبت آب به سیمان دقیق و کنترل‌شده باشد (مخلوط کارگاهی تقریباً همیشه پرآب‌تر از حد است).\n- ریزدانگی و عیار مصالح با ماشین واقعی انجام شود نه با بیل.\n- ریختگی بدون وقفه انجام شود؛ درز سردِ بین دو شیفت، نقطه ضعف دائمی سازه است.\n\nدر محل تخلیه، slump با مخروط آزمون چک و در صورت انحراف، واگن برگردانده می‌شود. از هر ریختگی نمونه مکعبی گرفته و نتیجه ۲۸ روزه آزمایشگاه در سند پروژه بایگانی می‌شود — همین برگه‌ها سال‌ها بعد هنگام فروش ملک، ارزش واقعی پروژه را اثبات می‌کنند.',
        coverImage: '/images/cons-2.jpg',
        readMinutes: 4,
        date: ev(24, 11),
      },
      {
        slug: 'upvc-windows',
        title: 'پنجره دوجداره UPVC؛ صرفه‌جویی که از اولین زمستان برگشت می‌خورد',
        category: 'نازک‌کاری',
        excerpt: 'پروفیل چند محفظه‌ای، ژیرومتر، شیشه ۴-۱۶-۴ low-e؛ استاندارد پنجره‌گذاری در پروژه‌های گروه.',
        content:
          'در اقلیم مشهد با زمستان‌های سرد و تابستان‌های داغ، پنجره سهم بزرگی از هدررفت انرژی خانه را دارد. پنجره استانداردی که در پروژه‌های ما اجرا می‌شود:\n\n- پروفیل UPVC با حداقل ۵ محفظه و تقویت فولادی داخل بازوها.\n- شیشه دوجداره ۴-۱۶-۴ با فضای خالی ۱۶ میلی‌متری و لبه warm-edge؛ در منظرهای جنوبی از شیشه low-e استفاده می‌کنیم.\n- ژیرومتر (آب‌بندی چندلایه) و درزبند مویی برای جلوگیری از نفوذ گردوغبار مشهد.\n- نصب با پیچ و فوم پلی‌اورتان + نوار آب‌بندی سه‌لایه (داخل، میانه، بیرون)؛ نصب بد، بهترین پنجره را بی‌اثر می‌کند.\n\nنتیجه: هزینه گرمایش واحد حدود ۲۵ تا ۳۵ درصد کاهش می‌یابد و صدا و غبار شهر بیرون می‌ماند.',
        coverImage: '/images/facade-2.jpg',
        readMinutes: 4,
        date: ev(29, 11),
      },
      {
        slug: 'mrl-elevator',
        title: 'آسانسور بدون موتورخانه (MRL) برای ساختمان‌های ۵ تا ۸ واحدی',
        category: 'برق و تاسیسات',
        excerpt: 'چرا در پروژه‌های چند واحدی گروه، آسانسور MRL نصب می‌کنیم؛ صرفه فضایی، انرژی و هزینه نگهداری.',
        content:
          'در ساختمان‌های ۵ تا ۸ واحدی، آسانسور ماشینی‌اتاق‌دار فضای مفید بام را قربانی می‌کند و هزینه ساخت موتورخانه و شفت اضافه دارد. راه‌حل ما در پروژه‌های اخیر، آسانسور MRL (Machine Room Less) است:\n\n- ماشین (گیربکس مغناطیس دائم) داخل چاهک نصب می‌شود و بام آزاد می‌ماند.\n- مصرف انرژی تا ۴۰٪ کمتر مدل‌های هیدرولیک معمولی است.\n- درایو VVVF با راه‌اندازی نرم و سطح صدای پایین؛ مناسب واحدهایی که اتاق خواب نزدیک شفت است.\n- قطعات استاندارد بازار ایران (تا نمایندگان متعدد داشته باشد) — این نکته در آسانسور از هر فناوری دیگری مهم‌تر است!\n\nزمان تحویل، نصب و تست بار (۱۱۰٪ ظرفیت) قبل از تحویل نهایی انجام و گواهی بازرسی در اسناد پروژه ثبت می‌شود.',
        coverImage: '/images/tower-3.jpg',
        readMinutes: 4,
        date: ev(38, 11),
      },
    ],
  })

  console.log('ایجاد رفرنس‌ها و بازنگری‌های مالک...')
  // نسخه ۱ نقشه (آرشیو) + نسخه ۲ (فعال) — نمایش منطق بازنگری
  const mapV1 = await db.referenceItem.create({
    data: {
      projectId: torghabe.id,
      title: 'نقشه پلان تاسیسات مکانیک — واحدها',
      category: 'map',
      description: 'نسخه اولیه لوله‌کشی رفت و برگشت؛ مسیر از شمال آشپزخانه واحدها.',
      fileUrl: '/images/bp-1.jpg',
      version: 1,
      status: 'superseded',
      addedById: owner.id,
      addedByName: 'جناب آقای فرهادی',
      createdAt: ev(20, 9),
    },
  })
  const mapV2 = await db.referenceItem.create({
    data: {
      projectId: torghabe.id,
      title: 'نقشه پلان تاسیسات مکانیک — واحدها',
      category: 'map',
      description:
        'بازنگری مسیر لوله‌ها به دلیل برخورد با ستون C-3؛ مسیر جدید از جنوب آشپزخانه و داخل کف کاذب رد می‌شود. طبق این نسخه اجرا شود.',
      fileUrl: '/images/bp-2.jpg',
      version: 2,
      status: 'active',
      addedById: owner.id,
      addedByName: 'جناب آقای فرهادی',
      createdAt: ev(2, 9),
    },
  })
  const facadeRef = await db.referenceItem.create({
    data: {
      projectId: torghabe.id,
      title: 'رفرنس نما — سنگ تراورتن کرم نواری',
      category: 'photo',
      description: 'سبک چیدمان نواری سنگ با درز ۲ سانتی؛ نمونه دلخواه مالک از پروژه‌های خیابان کوهسنگی.',
      fileUrl: '/images/facade-1.jpg',
      version: 1,
      status: 'active',
      addedById: owner.id,
      addedByName: 'جناب آقای فرهادی',
      createdAt: ev(15, 9),
    },
  })
  const parquetRef = await db.referenceItem.create({
    data: {
      projectId: torghabe.id,
      title: 'کف واحدها — پارکت مهندسی گونه بلوط',
      category: 'material',
      description: 'برند آرا، ضخامت ۸ میل با لایه رویه ۰٫۶؛ رنگ بلوط طبیعی مات. برای هر ۳ واحد یکسان باشد.',
      fileUrl: '/images/apt-2.jpg',
      version: 1,
      status: 'active',
      addedById: owner.id,
      addedByName: 'جناب آقای فرهادی',
      createdAt: ev(9, 9),
    },
  })

  await db.referenceMessage.createMany({
    data: [
      // بحث روی نقشه نسخه ۲
      {
        referenceId: mapV2.id,
        authorId: contractor.id,
        authorName: 'مهندس سعید زمانی',
        authorRole: 'contractor',
        text: 'در نسخه جدید، شعاع خم لوله در گذر از جنوب آشپزخانه چقدر در نظر گرفته شده؟ برای عبور از کف کاذب حداقل ۱۵ سانت فضا لازم داریم.',
        createdAt: ev(1, 11),
      },
      {
        referenceId: mapV2.id,
        authorId: executor.id,
        authorName: 'مهندس امیر کاظمی',
        authorRole: 'executor',
        text: 'ارتفاع کف کاذب ۲۵ سانت است و مسیر با شیب ملایم رد می‌شود؛ فضا کفایت می‌کند. شاسایی دقیق فردا انجام می‌شود و عکسش را در تایم‌لاین می‌گذارم.',
        createdAt: ev(1, 15),
      },
      {
        referenceId: mapV2.id,
        authorId: owner.id,
        authorName: 'جناب آقای فرهادی',
        authorRole: 'owner',
        text: 'ممنون از پیگیری. اگر هزینه تغییر مسیر برای سرویس واحد ۱ بیشتر از برآورد شد، قبل از اجرا به من اطلاع بدهید.',
        createdAt: ev(1, 18),
      },
      // سوال روی رفرنس نما
      {
        referenceId: facadeRef.id,
        authorId: contractor.id,
        authorName: 'مهندس سعید زمانی',
        authorRole: 'contractor',
        text: 'این چیدمان نواری برای نمای شمالی هم اعمال شود یا فقط جنوب؟ شمال معمولا با رنگ متفاوت اجرا می‌شود.',
        createdAt: ev(14, 10),
      },
      {
        referenceId: facadeRef.id,
        authorId: executor.id,
        authorName: 'مهندس امیر کاظمی',
        authorRole: 'executor',
        text: 'فقط نمای جنوبی نواری است؛ شمال ساده با همان سنگ ولی بدون چیدمان نواری. جزئیات در نقشه نما مشخص شده.',
        createdAt: ev(14, 14),
      },
      // تایید مالک روی پارکت
      {
        referenceId: parquetRef.id,
        authorId: owner.id,
        authorName: 'جناب آقای فرهادی',
        authorRole: 'owner',
        text: 'رنگ و بافت دقیقاً مطابق سلیقه‌ام است؛ همین را برای هر سه واحد سفارش بدهید.',
        createdAt: ev(8, 12),
      },
    ],
  })

  console.log('ایجاد رویدادهای رفرنس در تایم‌لاین...')
  await db.timelineEvent.createMany({
    data: [
      {
        projectId: torghabe.id,
        date: ev(2, 9),
        category: 'reference',
        title: 'رفرنس جدید: نقشه پلان تاسیسات مکانیک — واحدها (نسخه ۲)',
        description:
          'بازنگری مسیر لوله‌ها به دلیل برخورد با ستون C-3؛ مسیر جدید از جنوب آشپزخانه و داخل کف کاذب رد می‌شود. طبق این نسخه اجرا شود. — جزئیات در تب «رفرنس‌ها».',
        isReport: true,
        authorId: owner.id,
      },
      {
        projectId: torghabe.id,
        date: ev(15, 9),
        category: 'reference',
        title: 'رفرنس جدید: رفرنس نما — سنگ تراورتن کرم نواری',
        description: 'سبک چیدمان نواری سنگ با درز ۲ سانتی؛ نمونه دلخواه مالک. — جزئیات در تب «رفرنس‌ها».',
        isReport: true,
        authorId: owner.id,
      },
      {
        projectId: torghabe.id,
        date: ev(9, 9),
        category: 'reference',
        title: 'رفرنس جدید: کف واحدها — پارکت مهندسی گونه بلوط',
        description: 'برند آرا، ضخامت ۸ میل؛ رنگ بلوط طبیعی مات برای هر ۳ واحد. — جزئیات در تب «رفرنس‌ها».',
        isReport: true,
        authorId: owner.id,
      },
    ],
  })

  console.log('ایجاد پرداخت‌ها...')
  const payEvent1 = await db.timelineEvent.create({
    data: {
      projectId: torghabe.id,
      date: ev(135, 10),
      category: 'payment',
      title: 'رسید پرداخت ثبت شد',
      description: 'پیش‌پرداخت قرارداد اجرای کار — واریز به حساب شرکت پیمانکار.',
      isReport: true,
      authorId: owner.id,
    },
  })
  await db.paymentReceipt.create({
    data: {
      projectId: torghabe.id,
      date: ev(135, 10),
      amount: '750000000',
      description: 'پیش‌پرداخت قرارداد اجرای کار — واریز به حساب شرکت پیمانکار.',
      receiptImage: '/images/mat-1.jpg',
      addedById: owner.id,
      addedByName: 'جناب آقای فرهادی',
      timelineEventId: payEvent1.id,
    },
  })
  const payEvent2 = await db.timelineEvent.create({
    data: {
      projectId: torghabe.id,
      date: ev(70, 10),
      category: 'payment',
      title: 'رسید پرداخت ثبت شد',
      description: 'صورت‌وضعیت شماره ۲ — فاز اسکلت و سقف (تسویه جزئی).',
      isReport: true,
      authorId: owner.id,
    },
  })
  await db.paymentReceipt.create({
    data: {
      projectId: torghabe.id,
      date: ev(70, 10),
      amount: '850000000',
      description: 'صورت‌وضعیت شماره ۲ — فاز اسکلت و سقف (تسویه جزئی).',
      receiptImage: '/images/mat-2.jpg',
      addedById: owner.id,
      addedByName: 'جناب آقای فرهادی',
      timelineEventId: payEvent2.id,
    },
  })
  const payEvent3 = await db.timelineEvent.create({
    data: {
      projectId: torghabe.id,
      date: ev(18, 10),
      category: 'payment',
      title: 'رسید پرداخت ثبت شد',
      description: 'صورت‌وضعیت شماره ۳ — فاز دیوارچینی و آغاز تاسیسات.',
      isReport: true,
      authorId: owner.id,
    },
  })
  await db.paymentReceipt.create({
    data: {
      projectId: torghabe.id,
      date: ev(18, 10),
      amount: '600000000',
      description: 'صورت‌وضعیت شماره ۳ — فاز دیوارچینی و آغاز تاسیسات.',
      addedById: owner.id,
      addedByName: 'جناب آقای فرهادی',
      timelineEventId: payEvent3.id,
    },
  })
  void mapV1
  void mapV2
  void facadeRef
  void parquetRef

  console.log('✔ سید با موفقیت انجام شد')
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(() => db.$disconnect())
