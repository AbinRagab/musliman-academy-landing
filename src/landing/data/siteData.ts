import { gehadPortrait, ahmedPortrait, yossefPortrait } from './suppliedTeacherImages';
import type { IconName } from '../../components/Icon';
import { fatimahAlShazlyPhoto, mazinYasserPhoto } from './teacherImages';

export const contact = {
  whatsappDisplay: '+201038331058',
  whatsappNumber: '201038331058',
  email: 'musliman.link@gmail.com',
  website: 'www.muslimanacademy.com',
};

export const navLinks = [
  { labelKey: 'nav.about', href: '#about' },
  { labelKey: 'nav.programs', href: '#programs' },
  { labelKey: 'nav.scheduleFee', href: '#schedule-fee' },
  { labelKey: 'nav.whyChooseUs', href: '#why-choose-us' },
  { labelKey: 'nav.teacherTraining', href: '#teacher-training' },
  { labelKey: 'nav.faq', href: '#faq' },
];

export const countryOptions = [
  'Afghanistan',
  'Albania',
  'Algeria',
  'Andorra',
  'Angola',
  'Antigua and Barbuda',
  'Argentina',
  'Armenia',
  'Australia',
  'Austria',
  'Azerbaijan',
  'Bahamas',
  'Bahrain',
  'Bangladesh',
  'Barbados',
  'Belarus',
  'Belgium',
  'Belize',
  'Benin',
  'Bhutan',
  'Bolivia',
  'Bosnia and Herzegovina',
  'Botswana',
  'Brazil',
  'Brunei',
  'Bulgaria',
  'Burkina Faso',
  'Burundi',
  'Cabo Verde',
  'Cambodia',
  'Cameroon',
  'Canada',
  'Central African Republic',
  'Chad',
  'Chile',
  'China',
  'Colombia',
  'Comoros',
  'Congo',
  'Costa Rica',
  'Croatia',
  'Cuba',
  'Cyprus',
  'Czechia',
  'Democratic Republic of the Congo',
  'Denmark',
  'Djibouti',
  'Dominica',
  'Dominican Republic',
  'Ecuador',
  'Egypt',
  'El Salvador',
  'Equatorial Guinea',
  'Eritrea',
  'Estonia',
  'Eswatini',
  'Ethiopia',
  'Fiji',
  'Finland',
  'France',
  'Gabon',
  'Gambia',
  'Georgia',
  'Germany',
  'Ghana',
  'Greece',
  'Grenada',
  'Guatemala',
  'Guinea',
  'Guinea-Bissau',
  'Guyana',
  'Haiti',
  'Honduras',
  'Hungary',
  'Iceland',
  'India',
  'Indonesia',
  'Iran',
  'Iraq',
  'Ireland',
  'Israel',
  'Italy',
  'Ivory Coast',
  'Jamaica',
  'Japan',
  'Jordan',
  'Kazakhstan',
  'Kenya',
  'Kiribati',
  'Kosovo',
  'Kuwait',
  'Kyrgyzstan',
  'Laos',
  'Latvia',
  'Lebanon',
  'Lesotho',
  'Liberia',
  'Libya',
  'Liechtenstein',
  'Lithuania',
  'Luxembourg',
  'Madagascar',
  'Malawi',
  'Malaysia',
  'Maldives',
  'Mali',
  'Malta',
  'Marshall Islands',
  'Mauritania',
  'Mauritius',
  'Mexico',
  'Micronesia',
  'Moldova',
  'Monaco',
  'Mongolia',
  'Montenegro',
  'Morocco',
  'Mozambique',
  'Myanmar',
  'Namibia',
  'Nauru',
  'Nepal',
  'Netherlands',
  'New Zealand',
  'Nicaragua',
  'Niger',
  'Nigeria',
  'North Korea',
  'North Macedonia',
  'Norway',
  'Oman',
  'Pakistan',
  'Palau',
  'Palestine',
  'Panama',
  'Papua New Guinea',
  'Paraguay',
  'Peru',
  'Philippines',
  'Poland',
  'Portugal',
  'Qatar',
  'Romania',
  'Russia',
  'Rwanda',
  'Saint Kitts and Nevis',
  'Saint Lucia',
  'Saint Vincent and the Grenadines',
  'Samoa',
  'San Marino',
  'Sao Tome and Principe',
  'Saudi Arabia',
  'Senegal',
  'Serbia',
  'Seychelles',
  'Sierra Leone',
  'Singapore',
  'Slovakia',
  'Slovenia',
  'Solomon Islands',
  'Somalia',
  'South Africa',
  'South Korea',
  'South Sudan',
  'Spain',
  'Sri Lanka',
  'Sudan',
  'Suriname',
  'Sweden',
  'Switzerland',
  'Syria',
  'Taiwan',
  'Tajikistan',
  'Tanzania',
  'Thailand',
  'Timor-Leste',
  'Togo',
  'Tonga',
  'Trinidad and Tobago',
  'Tunisia',
  'Turkey',
  'Turkmenistan',
  'Tuvalu',
  'Uganda',
  'Ukraine',
  'United Arab Emirates',
  'United Kingdom',
  'United States',
  'Uruguay',
  'Uzbekistan',
  'Vanuatu',
  'Vatican City',
  'Venezuela',
  'Vietnam',
  'Yemen',
  'Zambia',
  'Zimbabwe',
  'Other',
];

export const programs: Array<{ number: string; key: string; icon: IconName; image: string }> = [
  { number: '1', key: 'quranReading', icon: 'book', image: '/assets/programs/quran-reading.png' },
  { number: '2', key: 'tarteelQaidah', icon: 'languages', image: '/assets/programs/tarteel-qaidah.png' },
  { number: '3', key: 'quranMemorization', icon: 'bookMarked', image: '/assets/programs/quran-memorization.png' },
  { number: '4', key: 'tajweed', icon: 'scrollText', image: '/assets/programs/tajweed.png' },
  { number: '5', key: 'quranTafseer', icon: 'fileText', image: '/assets/programs/quran-tafseer.png' },
  { number: '6', key: 'arabicLanguage', icon: 'languages', image: '/assets/programs/arabic-language.png' },
  { number: '7', key: 'islamicStudies', icon: 'landmark', image: '/assets/programs/islamic-studies.png' },
  { number: '8', key: 'islamicValues', icon: 'heartHandshake', image: '/assets/programs/islamic-values-children.png' },
];

export const bookingProgramOptions: Array<{ key: string; name: string }> = [
  { key: 'quranReading', name: 'Quran Reading' },
  { key: 'tarteelQaidah', name: 'Tarteel Qaidah' },
  { key: 'quranMemorization', name: 'Quran Memorization' },
  { key: 'tajweed', name: 'Tajweed' },
  { key: 'quranTafseer', name: 'Quran Tafseer' },
  { key: 'arabicLanguage', name: 'Arabic Language' },
  { key: 'islamicStudies', name: 'Islamic Studies' },
  { key: 'islamicValues', name: 'Islamic Values for Children' },
];

export type PricingCurrency = 'USD' | 'CAD' | 'GBP' | 'AUD';
export type PricingTier = 'Foundational' | 'Standard' | 'Specialized';

export const pricingData: Record<PricingCurrency, {
  label: string;
  symbol: string;
  rows: Array<{
    track: string;
    tier: PricingTier;
    oneOnOne: string;
    group: string;
    monthly: string;
  }>;
}> = {
  USD: {
    label: 'USA Dollars',
    symbol: '$',
    rows: [
      { track: 'Tarteel Qaidah', tier: 'Foundational', oneOnOne: '$8 / Hour', group: '$6 / Hour', monthly: '$32 / Month' },
      { track: 'Arabic Language', tier: 'Foundational', oneOnOne: '$8 / Hour', group: '$6 / Hour', monthly: '$32 / Month' },
      { track: 'Islamic Values for Children', tier: 'Foundational', oneOnOne: '$8 / Hour', group: '$6 / Hour', monthly: '$32 / Month' },
      { track: 'Quran Reading', tier: 'Standard', oneOnOne: '$8 / Hour', group: '$6 / Hour', monthly: '$32 / Month' },
      { track: 'Tajweed', tier: 'Standard', oneOnOne: '$8 / Hour', group: '$6 / Hour', monthly: '$32 / Month' },
      { track: 'Islamic Studies', tier: 'Standard', oneOnOne: '$8 / Hour', group: '$6 / Hour', monthly: '$32 / Month' },
      { track: 'Quran Memorization', tier: 'Specialized', oneOnOne: '$8 / Hour', group: '$6 / Hour', monthly: '$32 / Month' },
      { track: 'Quran Tafseer', tier: 'Specialized', oneOnOne: '$8 / Hour', group: '$6 / Hour', monthly: '$32 / Month' },
    ],
  },
  CAD: {
    label: 'Canadian Dollars',
    symbol: 'C$',
    rows: [
      { track: 'Tarteel Qaidah', tier: 'Foundational', oneOnOne: 'C$11.36 / Hour', group: 'C$8.52 / Hour', monthly: 'C$45.44 / Month' },
      { track: 'Arabic Language', tier: 'Foundational', oneOnOne: 'C$11.36 / Hour', group: 'C$8.52 / Hour', monthly: 'C$45.44 / Month' },
      { track: 'Islamic Values for Children', tier: 'Foundational', oneOnOne: 'C$11.36 / Hour', group: 'C$8.52 / Hour', monthly: 'C$45.44 / Month' },
      { track: 'Quran Reading', tier: 'Standard', oneOnOne: 'C$11.36 / Hour', group: 'C$8.52 / Hour', monthly: 'C$45.44 / Month' },
      { track: 'Tajweed', tier: 'Standard', oneOnOne: 'C$11.36 / Hour', group: 'C$8.52 / Hour', monthly: 'C$45.44 / Month' },
      { track: 'Islamic Studies', tier: 'Standard', oneOnOne: 'C$11.36 / Hour', group: 'C$8.52 / Hour', monthly: 'C$45.44 / Month' },
      { track: 'Quran Memorization', tier: 'Specialized', oneOnOne: 'C$11.36 / Hour', group: 'C$8.52 / Hour', monthly: 'C$45.44 / Month' },
      { track: 'Quran Tafseer', tier: 'Specialized', oneOnOne: 'C$11.36 / Hour', group: 'C$8.52 / Hour', monthly: 'C$45.44 / Month' },
    ],
  },
  GBP: {
    label: 'UK Pounds',
    symbol: '',
    rows: [
      { track: 'Tarteel Qaidah', tier: 'Foundational', oneOnOne: '6.00 / Hour', group: '4.50 / Hour', monthly: '24.00 / Month' },
      { track: 'Arabic Language', tier: 'Foundational', oneOnOne: '6.00 / Hour', group: '4.50 / Hour', monthly: '24.00 / Month' },
      { track: 'Islamic Values for Children', tier: 'Foundational', oneOnOne: '6.00 / Hour', group: '4.50 / Hour', monthly: '24.00 / Month' },
      { track: 'Quran Reading', tier: 'Standard', oneOnOne: '6.00 / Hour', group: '4.50 / Hour', monthly: '24.00 / Month' },
      { track: 'Tajweed', tier: 'Standard', oneOnOne: '6.00 / Hour', group: '4.50 / Hour', monthly: '24.00 / Month' },
      { track: 'Islamic Studies', tier: 'Standard', oneOnOne: '6.00 / Hour', group: '4.50 / Hour', monthly: '24.00 / Month' },
      { track: 'Quran Memorization', tier: 'Specialized', oneOnOne: '6.00 / Hour', group: '4.50 / Hour', monthly: '24.00 / Month' },
      { track: 'Quran Tafseer', tier: 'Specialized', oneOnOne: '6.00 / Hour', group: '4.50 / Hour', monthly: '24.00 / Month' },
    ],
  },
  AUD: {
    label: 'Australian Dollars',
    symbol: 'A$',
    rows: [
      { track: 'Tarteel Qaidah', tier: 'Foundational', oneOnOne: 'A$11.52 / Hour', group: 'A$8.64 / Hour', monthly: 'A$46.08 / Month' },
      { track: 'Arabic Language', tier: 'Foundational', oneOnOne: 'A$11.52 / Hour', group: 'A$8.64 / Hour', monthly: 'A$46.08 / Month' },
      { track: 'Islamic Values for Children', tier: 'Foundational', oneOnOne: 'A$11.52 / Hour', group: 'A$8.64 / Hour', monthly: 'A$46.08 / Month' },
      { track: 'Quran Reading', tier: 'Standard', oneOnOne: 'A$11.52 / Hour', group: 'A$8.64 / Hour', monthly: 'A$46.08 / Month' },
      { track: 'Tajweed', tier: 'Standard', oneOnOne: 'A$11.52 / Hour', group: 'A$8.64 / Hour', monthly: 'A$46.08 / Month' },
      { track: 'Islamic Studies', tier: 'Standard', oneOnOne: 'A$11.52 / Hour', group: 'A$8.64 / Hour', monthly: 'A$46.08 / Month' },
      { track: 'Quran Memorization', tier: 'Specialized', oneOnOne: 'A$11.52 / Hour', group: 'A$8.64 / Hour', monthly: 'A$46.08 / Month' },
      { track: 'Quran Tafseer', tier: 'Specialized', oneOnOne: 'A$11.52 / Hour', group: 'A$8.64 / Hour', monthly: 'A$46.08 / Month' },
    ],
  },
};

export const testimonials = [
  {
    "key": "mazinStudentBeginning",
    "quote": "When I first started, I couldn't read the Qur'an at all. I didn't even know the Arabic alphabet that well, so I was starting from the very beginning. I wasn't sure how quickly I would learn, but Brother Mazen made the whole process easy to follow and never made me feel discouraged.",
    "name": "A Qur'an Student",
    "country": "United States",
    "program": "Quran Reading",
    "description": "Student of Brother Mazen",
    "flagImage": "data:image/svg+xml,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20viewBox%3D%220%200%20190%20100%22%3E%3Crect%20width%3D%22190%22%20height%3D%22100%22%20fill%3D%22%23fff%22%2F%3E%3Cpath%20stroke%3D%22%23b22234%22%20stroke-width%3D%227.7%22%20d%3D%22M0%203.85h190M0%2019.23h190M0%2034.62h190M0%2050h190M0%2065.38h190M0%2080.77h190M0%2096.15h190%22%2F%3E%3Crect%20width%3D%2276%22%20height%3D%2254%22%20fill%3D%22%233c3b6e%22%2F%3E%3Ccircle%20cx%3D%227%22%20cy%3D%225%22%20r%3D%221.6%22%20fill%3D%22%23fff%22%2F%3E%3Ccircle%20cx%3D%2219%22%20cy%3D%225%22%20r%3D%221.6%22%20fill%3D%22%23fff%22%2F%3E%3Ccircle%20cx%3D%2231%22%20cy%3D%225%22%20r%3D%221.6%22%20fill%3D%22%23fff%22%2F%3E%3Ccircle%20cx%3D%2243%22%20cy%3D%225%22%20r%3D%221.6%22%20fill%3D%22%23fff%22%2F%3E%3Ccircle%20cx%3D%2255%22%20cy%3D%225%22%20r%3D%221.6%22%20fill%3D%22%23fff%22%2F%3E%3Ccircle%20cx%3D%2267%22%20cy%3D%225%22%20r%3D%221.6%22%20fill%3D%22%23fff%22%2F%3E%3Ccircle%20cx%3D%2213%22%20cy%3D%2210.5%22%20r%3D%221.6%22%20fill%3D%22%23fff%22%2F%3E%3Ccircle%20cx%3D%2225%22%20cy%3D%2210.5%22%20r%3D%221.6%22%20fill%3D%22%23fff%22%2F%3E%3Ccircle%20cx%3D%2237%22%20cy%3D%2210.5%22%20r%3D%221.6%22%20fill%3D%22%23fff%22%2F%3E%3Ccircle%20cx%3D%2249%22%20cy%3D%2210.5%22%20r%3D%221.6%22%20fill%3D%22%23fff%22%2F%3E%3Ccircle%20cx%3D%2261%22%20cy%3D%2210.5%22%20r%3D%221.6%22%20fill%3D%22%23fff%22%2F%3E%3Ccircle%20cx%3D%227%22%20cy%3D%2216%22%20r%3D%221.6%22%20fill%3D%22%23fff%22%2F%3E%3Ccircle%20cx%3D%2219%22%20cy%3D%2216%22%20r%3D%221.6%22%20fill%3D%22%23fff%22%2F%3E%3Ccircle%20cx%3D%2231%22%20cy%3D%2216%22%20r%3D%221.6%22%20fill%3D%22%23fff%22%2F%3E%3Ccircle%20cx%3D%2243%22%20cy%3D%2216%22%20r%3D%221.6%22%20fill%3D%22%23fff%22%2F%3E%3Ccircle%20cx%3D%2255%22%20cy%3D%2216%22%20r%3D%221.6%22%20fill%3D%22%23fff%22%2F%3E%3Ccircle%20cx%3D%2267%22%20cy%3D%2216%22%20r%3D%221.6%22%20fill%3D%22%23fff%22%2F%3E%3Ccircle%20cx%3D%2213%22%20cy%3D%2221.5%22%20r%3D%221.6%22%20fill%3D%22%23fff%22%2F%3E%3Ccircle%20cx%3D%2225%22%20cy%3D%2221.5%22%20r%3D%221.6%22%20fill%3D%22%23fff%22%2F%3E%3Ccircle%20cx%3D%2237%22%20cy%3D%2221.5%22%20r%3D%221.6%22%20fill%3D%22%23fff%22%2F%3E%3Ccircle%20cx%3D%2249%22%20cy%3D%2221.5%22%20r%3D%221.6%22%20fill%3D%22%23fff%22%2F%3E%3Ccircle%20cx%3D%2261%22%20cy%3D%2221.5%22%20r%3D%221.6%22%20fill%3D%22%23fff%22%2F%3E%3Ccircle%20cx%3D%227%22%20cy%3D%2227%22%20r%3D%221.6%22%20fill%3D%22%23fff%22%2F%3E%3Ccircle%20cx%3D%2219%22%20cy%3D%2227%22%20r%3D%221.6%22%20fill%3D%22%23fff%22%2F%3E%3Ccircle%20cx%3D%2231%22%20cy%3D%2227%22%20r%3D%221.6%22%20fill%3D%22%23fff%22%2F%3E%3Ccircle%20cx%3D%2243%22%20cy%3D%2227%22%20r%3D%221.6%22%20fill%3D%22%23fff%22%2F%3E%3Ccircle%20cx%3D%2255%22%20cy%3D%2227%22%20r%3D%221.6%22%20fill%3D%22%23fff%22%2F%3E%3Ccircle%20cx%3D%2267%22%20cy%3D%2227%22%20r%3D%221.6%22%20fill%3D%22%23fff%22%2F%3E%3Ccircle%20cx%3D%2213%22%20cy%3D%2232.5%22%20r%3D%221.6%22%20fill%3D%22%23fff%22%2F%3E%3Ccircle%20cx%3D%2225%22%20cy%3D%2232.5%22%20r%3D%221.6%22%20fill%3D%22%23fff%22%2F%3E%3Ccircle%20cx%3D%2237%22%20cy%3D%2232.5%22%20r%3D%221.6%22%20fill%3D%22%23fff%22%2F%3E%3Ccircle%20cx%3D%2249%22%20cy%3D%2232.5%22%20r%3D%221.6%22%20fill%3D%22%23fff%22%2F%3E%3Ccircle%20cx%3D%2261%22%20cy%3D%2232.5%22%20r%3D%221.6%22%20fill%3D%22%23fff%22%2F%3E%3Ccircle%20cx%3D%227%22%20cy%3D%2238%22%20r%3D%221.6%22%20fill%3D%22%23fff%22%2F%3E%3Ccircle%20cx%3D%2219%22%20cy%3D%2238%22%20r%3D%221.6%22%20fill%3D%22%23fff%22%2F%3E%3Ccircle%20cx%3D%2231%22%20cy%3D%2238%22%20r%3D%221.6%22%20fill%3D%22%23fff%22%2F%3E%3Ccircle%20cx%3D%2243%22%20cy%3D%2238%22%20r%3D%221.6%22%20fill%3D%22%23fff%22%2F%3E%3Ccircle%20cx%3D%2255%22%20cy%3D%2238%22%20r%3D%221.6%22%20fill%3D%22%23fff%22%2F%3E%3Ccircle%20cx%3D%2267%22%20cy%3D%2238%22%20r%3D%221.6%22%20fill%3D%22%23fff%22%2F%3E%3Ccircle%20cx%3D%2213%22%20cy%3D%2243.5%22%20r%3D%221.6%22%20fill%3D%22%23fff%22%2F%3E%3Ccircle%20cx%3D%2225%22%20cy%3D%2243.5%22%20r%3D%221.6%22%20fill%3D%22%23fff%22%2F%3E%3Ccircle%20cx%3D%2237%22%20cy%3D%2243.5%22%20r%3D%221.6%22%20fill%3D%22%23fff%22%2F%3E%3Ccircle%20cx%3D%2249%22%20cy%3D%2243.5%22%20r%3D%221.6%22%20fill%3D%22%23fff%22%2F%3E%3Ccircle%20cx%3D%2261%22%20cy%3D%2243.5%22%20r%3D%221.6%22%20fill%3D%22%23fff%22%2F%3E%3Ccircle%20cx%3D%227%22%20cy%3D%2249%22%20r%3D%221.6%22%20fill%3D%22%23fff%22%2F%3E%3Ccircle%20cx%3D%2219%22%20cy%3D%2249%22%20r%3D%221.6%22%20fill%3D%22%23fff%22%2F%3E%3Ccircle%20cx%3D%2231%22%20cy%3D%2249%22%20r%3D%221.6%22%20fill%3D%22%23fff%22%2F%3E%3Ccircle%20cx%3D%2243%22%20cy%3D%2249%22%20r%3D%221.6%22%20fill%3D%22%23fff%22%2F%3E%3Ccircle%20cx%3D%2255%22%20cy%3D%2249%22%20r%3D%221.6%22%20fill%3D%22%23fff%22%2F%3E%3Ccircle%20cx%3D%2267%22%20cy%3D%2249%22%20r%3D%221.6%22%20fill%3D%22%23fff%22%2F%3E%3C%2Fsvg%3E"
  },
  {
    "key": "mazinStudentProgress",
    "quote": "Alhamdulillah, by the mercy of Allah and through Brother Mazen's guidance, I can now pick up the Qur'an and read it. I still have more to learn, but when I think about where I started, I'm amazed at how much progress I've made over the past year with him.",
    "name": "A Qur'an Student",
    "country": "United States",
    "program": "Quran Reading",
    "description": "Student of Brother Mazen",
    "flagImage": "data:image/svg+xml,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20viewBox%3D%220%200%20190%20100%22%3E%3Crect%20width%3D%22190%22%20height%3D%22100%22%20fill%3D%22%23fff%22%2F%3E%3Cpath%20stroke%3D%22%23b22234%22%20stroke-width%3D%227.7%22%20d%3D%22M0%203.85h190M0%2019.23h190M0%2034.62h190M0%2050h190M0%2065.38h190M0%2080.77h190M0%2096.15h190%22%2F%3E%3Crect%20width%3D%2276%22%20height%3D%2254%22%20fill%3D%22%233c3b6e%22%2F%3E%3Ccircle%20cx%3D%227%22%20cy%3D%225%22%20r%3D%221.6%22%20fill%3D%22%23fff%22%2F%3E%3Ccircle%20cx%3D%2219%22%20cy%3D%225%22%20r%3D%221.6%22%20fill%3D%22%23fff%22%2F%3E%3Ccircle%20cx%3D%2231%22%20cy%3D%225%22%20r%3D%221.6%22%20fill%3D%22%23fff%22%2F%3E%3Ccircle%20cx%3D%2243%22%20cy%3D%225%22%20r%3D%221.6%22%20fill%3D%22%23fff%22%2F%3E%3Ccircle%20cx%3D%2255%22%20cy%3D%225%22%20r%3D%221.6%22%20fill%3D%22%23fff%22%2F%3E%3Ccircle%20cx%3D%2267%22%20cy%3D%225%22%20r%3D%221.6%22%20fill%3D%22%23fff%22%2F%3E%3Ccircle%20cx%3D%2213%22%20cy%3D%2210.5%22%20r%3D%221.6%22%20fill%3D%22%23fff%22%2F%3E%3Ccircle%20cx%3D%2225%22%20cy%3D%2210.5%22%20r%3D%221.6%22%20fill%3D%22%23fff%22%2F%3E%3Ccircle%20cx%3D%2237%22%20cy%3D%2210.5%22%20r%3D%221.6%22%20fill%3D%22%23fff%22%2F%3E%3Ccircle%20cx%3D%2249%22%20cy%3D%2210.5%22%20r%3D%221.6%22%20fill%3D%22%23fff%22%2F%3E%3Ccircle%20cx%3D%2261%22%20cy%3D%2210.5%22%20r%3D%221.6%22%20fill%3D%22%23fff%22%2F%3E%3Ccircle%20cx%3D%227%22%20cy%3D%2216%22%20r%3D%221.6%22%20fill%3D%22%23fff%22%2F%3E%3Ccircle%20cx%3D%2219%22%20cy%3D%2216%22%20r%3D%221.6%22%20fill%3D%22%23fff%22%2F%3E%3Ccircle%20cx%3D%2231%22%20cy%3D%2216%22%20r%3D%221.6%22%20fill%3D%22%23fff%22%2F%3E%3Ccircle%20cx%3D%2243%22%20cy%3D%2216%22%20r%3D%221.6%22%20fill%3D%22%23fff%22%2F%3E%3Ccircle%20cx%3D%2255%22%20cy%3D%2216%22%20r%3D%221.6%22%20fill%3D%22%23fff%22%2F%3E%3Ccircle%20cx%3D%2267%22%20cy%3D%2216%22%20r%3D%221.6%22%20fill%3D%22%23fff%22%2F%3E%3Ccircle%20cx%3D%2213%22%20cy%3D%2221.5%22%20r%3D%221.6%22%20fill%3D%22%23fff%22%2F%3E%3Ccircle%20cx%3D%2225%22%20cy%3D%2221.5%22%20r%3D%221.6%22%20fill%3D%22%23fff%22%2F%3E%3Ccircle%20cx%3D%2237%22%20cy%3D%2221.5%22%20r%3D%221.6%22%20fill%3D%22%23fff%22%2F%3E%3Ccircle%20cx%3D%2249%22%20cy%3D%2221.5%22%20r%3D%221.6%22%20fill%3D%22%23fff%22%2F%3E%3Ccircle%20cx%3D%2261%22%20cy%3D%2221.5%22%20r%3D%221.6%22%20fill%3D%22%23fff%22%2F%3E%3Ccircle%20cx%3D%227%22%20cy%3D%2227%22%20r%3D%221.6%22%20fill%3D%22%23fff%22%2F%3E%3Ccircle%20cx%3D%2219%22%20cy%3D%2227%22%20r%3D%221.6%22%20fill%3D%22%23fff%22%2F%3E%3Ccircle%20cx%3D%2231%22%20cy%3D%2227%22%20r%3D%221.6%22%20fill%3D%22%23fff%22%2F%3E%3Ccircle%20cx%3D%2243%22%20cy%3D%2227%22%20r%3D%221.6%22%20fill%3D%22%23fff%22%2F%3E%3Ccircle%20cx%3D%2255%22%20cy%3D%2227%22%20r%3D%221.6%22%20fill%3D%22%23fff%22%2F%3E%3Ccircle%20cx%3D%2267%22%20cy%3D%2227%22%20r%3D%221.6%22%20fill%3D%22%23fff%22%2F%3E%3Ccircle%20cx%3D%2213%22%20cy%3D%2232.5%22%20r%3D%221.6%22%20fill%3D%22%23fff%22%2F%3E%3Ccircle%20cx%3D%2225%22%20cy%3D%2232.5%22%20r%3D%221.6%22%20fill%3D%22%23fff%22%2F%3E%3Ccircle%20cx%3D%2237%22%20cy%3D%2232.5%22%20r%3D%221.6%22%20fill%3D%22%23fff%22%2F%3E%3Ccircle%20cx%3D%2249%22%20cy%3D%2232.5%22%20r%3D%221.6%22%20fill%3D%22%23fff%22%2F%3E%3Ccircle%20cx%3D%2261%22%20cy%3D%2232.5%22%20r%3D%221.6%22%20fill%3D%22%23fff%22%2F%3E%3Ccircle%20cx%3D%227%22%20cy%3D%2238%22%20r%3D%221.6%22%20fill%3D%22%23fff%22%2F%3E%3Ccircle%20cx%3D%2219%22%20cy%3D%2238%22%20r%3D%221.6%22%20fill%3D%22%23fff%22%2F%3E%3Ccircle%20cx%3D%2231%22%20cy%3D%2238%22%20r%3D%221.6%22%20fill%3D%22%23fff%22%2F%3E%3Ccircle%20cx%3D%2243%22%20cy%3D%2238%22%20r%3D%221.6%22%20fill%3D%22%23fff%22%2F%3E%3Ccircle%20cx%3D%2255%22%20cy%3D%2238%22%20r%3D%221.6%22%20fill%3D%22%23fff%22%2F%3E%3Ccircle%20cx%3D%2267%22%20cy%3D%2238%22%20r%3D%221.6%22%20fill%3D%22%23fff%22%2F%3E%3Ccircle%20cx%3D%2213%22%20cy%3D%2243.5%22%20r%3D%221.6%22%20fill%3D%22%23fff%22%2F%3E%3Ccircle%20cx%3D%2225%22%20cy%3D%2243.5%22%20r%3D%221.6%22%20fill%3D%22%23fff%22%2F%3E%3Ccircle%20cx%3D%2237%22%20cy%3D%2243.5%22%20r%3D%221.6%22%20fill%3D%22%23fff%22%2F%3E%3Ccircle%20cx%3D%2249%22%20cy%3D%2243.5%22%20r%3D%221.6%22%20fill%3D%22%23fff%22%2F%3E%3Ccircle%20cx%3D%2261%22%20cy%3D%2243.5%22%20r%3D%221.6%22%20fill%3D%22%23fff%22%2F%3E%3Ccircle%20cx%3D%227%22%20cy%3D%2249%22%20r%3D%221.6%22%20fill%3D%22%23fff%22%2F%3E%3Ccircle%20cx%3D%2219%22%20cy%3D%2249%22%20r%3D%221.6%22%20fill%3D%22%23fff%22%2F%3E%3Ccircle%20cx%3D%2231%22%20cy%3D%2249%22%20r%3D%221.6%22%20fill%3D%22%23fff%22%2F%3E%3Ccircle%20cx%3D%2243%22%20cy%3D%2249%22%20r%3D%221.6%22%20fill%3D%22%23fff%22%2F%3E%3Ccircle%20cx%3D%2255%22%20cy%3D%2249%22%20r%3D%221.6%22%20fill%3D%22%23fff%22%2F%3E%3Ccircle%20cx%3D%2267%22%20cy%3D%2249%22%20r%3D%221.6%22%20fill%3D%22%23fff%22%2F%3E%3C%2Fsvg%3E"
  },
  {
    "key": "mazinStudentStructure",
    "quote": "His teaching style is structured, encouraging, and easy to follow. Each lesson builds on the last, so you continue making steady progress without feeling overwhelmed. He also gives you the confidence to keep trying, even when you make mistakes, and that has made a huge difference in my learning.",
    "name": "A Qur'an Student",
    "country": "United States",
    "program": "Quran Reading",
    "description": "Student of Brother Mazen",
    "flagImage": "data:image/svg+xml,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20viewBox%3D%220%200%20190%20100%22%3E%3Crect%20width%3D%22190%22%20height%3D%22100%22%20fill%3D%22%23fff%22%2F%3E%3Cpath%20stroke%3D%22%23b22234%22%20stroke-width%3D%227.7%22%20d%3D%22M0%203.85h190M0%2019.23h190M0%2034.62h190M0%2050h190M0%2065.38h190M0%2080.77h190M0%2096.15h190%22%2F%3E%3Crect%20width%3D%2276%22%20height%3D%2254%22%20fill%3D%22%233c3b6e%22%2F%3E%3Ccircle%20cx%3D%227%22%20cy%3D%225%22%20r%3D%221.6%22%20fill%3D%22%23fff%22%2F%3E%3Ccircle%20cx%3D%2219%22%20cy%3D%225%22%20r%3D%221.6%22%20fill%3D%22%23fff%22%2F%3E%3Ccircle%20cx%3D%2231%22%20cy%3D%225%22%20r%3D%221.6%22%20fill%3D%22%23fff%22%2F%3E%3Ccircle%20cx%3D%2243%22%20cy%3D%225%22%20r%3D%221.6%22%20fill%3D%22%23fff%22%2F%3E%3Ccircle%20cx%3D%2255%22%20cy%3D%225%22%20r%3D%221.6%22%20fill%3D%22%23fff%22%2F%3E%3Ccircle%20cx%3D%2267%22%20cy%3D%225%22%20r%3D%221.6%22%20fill%3D%22%23fff%22%2F%3E%3Ccircle%20cx%3D%2213%22%20cy%3D%2210.5%22%20r%3D%221.6%22%20fill%3D%22%23fff%22%2F%3E%3Ccircle%20cx%3D%2225%22%20cy%3D%2210.5%22%20r%3D%221.6%22%20fill%3D%22%23fff%22%2F%3E%3Ccircle%20cx%3D%2237%22%20cy%3D%2210.5%22%20r%3D%221.6%22%20fill%3D%22%23fff%22%2F%3E%3Ccircle%20cx%3D%2249%22%20cy%3D%2210.5%22%20r%3D%221.6%22%20fill%3D%22%23fff%22%2F%3E%3Ccircle%20cx%3D%2261%22%20cy%3D%2210.5%22%20r%3D%221.6%22%20fill%3D%22%23fff%22%2F%3E%3Ccircle%20cx%3D%227%22%20cy%3D%2216%22%20r%3D%221.6%22%20fill%3D%22%23fff%22%2F%3E%3Ccircle%20cx%3D%2219%22%20cy%3D%2216%22%20r%3D%221.6%22%20fill%3D%22%23fff%22%2F%3E%3Ccircle%20cx%3D%2231%22%20cy%3D%2216%22%20r%3D%221.6%22%20fill%3D%22%23fff%22%2F%3E%3Ccircle%20cx%3D%2243%22%20cy%3D%2216%22%20r%3D%221.6%22%20fill%3D%22%23fff%22%2F%3E%3Ccircle%20cx%3D%2255%22%20cy%3D%2216%22%20r%3D%221.6%22%20fill%3D%22%23fff%22%2F%3E%3Ccircle%20cx%3D%2267%22%20cy%3D%2216%22%20r%3D%221.6%22%20fill%3D%22%23fff%22%2F%3E%3Ccircle%20cx%3D%2213%22%20cy%3D%2221.5%22%20r%3D%221.6%22%20fill%3D%22%23fff%22%2F%3E%3Ccircle%20cx%3D%2225%22%20cy%3D%2221.5%22%20r%3D%221.6%22%20fill%3D%22%23fff%22%2F%3E%3Ccircle%20cx%3D%2237%22%20cy%3D%2221.5%22%20r%3D%221.6%22%20fill%3D%22%23fff%22%2F%3E%3Ccircle%20cx%3D%2249%22%20cy%3D%2221.5%22%20r%3D%221.6%22%20fill%3D%22%23fff%22%2F%3E%3Ccircle%20cx%3D%2261%22%20cy%3D%2221.5%22%20r%3D%221.6%22%20fill%3D%22%23fff%22%2F%3E%3Ccircle%20cx%3D%227%22%20cy%3D%2227%22%20r%3D%221.6%22%20fill%3D%22%23fff%22%2F%3E%3Ccircle%20cx%3D%2219%22%20cy%3D%2227%22%20r%3D%221.6%22%20fill%3D%22%23fff%22%2F%3E%3Ccircle%20cx%3D%2231%22%20cy%3D%2227%22%20r%3D%221.6%22%20fill%3D%22%23fff%22%2F%3E%3Ccircle%20cx%3D%2243%22%20cy%3D%2227%22%20r%3D%221.6%22%20fill%3D%22%23fff%22%2F%3E%3Ccircle%20cx%3D%2255%22%20cy%3D%2227%22%20r%3D%221.6%22%20fill%3D%22%23fff%22%2F%3E%3Ccircle%20cx%3D%2267%22%20cy%3D%2227%22%20r%3D%221.6%22%20fill%3D%22%23fff%22%2F%3E%3Ccircle%20cx%3D%2213%22%20cy%3D%2232.5%22%20r%3D%221.6%22%20fill%3D%22%23fff%22%2F%3E%3Ccircle%20cx%3D%2225%22%20cy%3D%2232.5%22%20r%3D%221.6%22%20fill%3D%22%23fff%22%2F%3E%3Ccircle%20cx%3D%2237%22%20cy%3D%2232.5%22%20r%3D%221.6%22%20fill%3D%22%23fff%22%2F%3E%3Ccircle%20cx%3D%2249%22%20cy%3D%2232.5%22%20r%3D%221.6%22%20fill%3D%22%23fff%22%2F%3E%3Ccircle%20cx%3D%2261%22%20cy%3D%2232.5%22%20r%3D%221.6%22%20fill%3D%22%23fff%22%2F%3E%3Ccircle%20cx%3D%227%22%20cy%3D%2238%22%20r%3D%221.6%22%20fill%3D%22%23fff%22%2F%3E%3Ccircle%20cx%3D%2219%22%20cy%3D%2238%22%20r%3D%221.6%22%20fill%3D%22%23fff%22%2F%3E%3Ccircle%20cx%3D%2231%22%20cy%3D%2238%22%20r%3D%221.6%22%20fill%3D%22%23fff%22%2F%3E%3Ccircle%20cx%3D%2243%22%20cy%3D%2238%22%20r%3D%221.6%22%20fill%3D%22%23fff%22%2F%3E%3Ccircle%20cx%3D%2255%22%20cy%3D%2238%22%20r%3D%221.6%22%20fill%3D%22%23fff%22%2F%3E%3Ccircle%20cx%3D%2267%22%20cy%3D%2238%22%20r%3D%221.6%22%20fill%3D%22%23fff%22%2F%3E%3Ccircle%20cx%3D%2213%22%20cy%3D%2243.5%22%20r%3D%221.6%22%20fill%3D%22%23fff%22%2F%3E%3Ccircle%20cx%3D%2225%22%20cy%3D%2243.5%22%20r%3D%221.6%22%20fill%3D%22%23fff%22%2F%3E%3Ccircle%20cx%3D%2237%22%20cy%3D%2243.5%22%20r%3D%221.6%22%20fill%3D%22%23fff%22%2F%3E%3Ccircle%20cx%3D%2249%22%20cy%3D%2243.5%22%20r%3D%221.6%22%20fill%3D%22%23fff%22%2F%3E%3Ccircle%20cx%3D%2261%22%20cy%3D%2243.5%22%20r%3D%221.6%22%20fill%3D%22%23fff%22%2F%3E%3Ccircle%20cx%3D%227%22%20cy%3D%2249%22%20r%3D%221.6%22%20fill%3D%22%23fff%22%2F%3E%3Ccircle%20cx%3D%2219%22%20cy%3D%2249%22%20r%3D%221.6%22%20fill%3D%22%23fff%22%2F%3E%3Ccircle%20cx%3D%2231%22%20cy%3D%2249%22%20r%3D%221.6%22%20fill%3D%22%23fff%22%2F%3E%3Ccircle%20cx%3D%2243%22%20cy%3D%2249%22%20r%3D%221.6%22%20fill%3D%22%23fff%22%2F%3E%3Ccircle%20cx%3D%2255%22%20cy%3D%2249%22%20r%3D%221.6%22%20fill%3D%22%23fff%22%2F%3E%3Ccircle%20cx%3D%2267%22%20cy%3D%2249%22%20r%3D%221.6%22%20fill%3D%22%23fff%22%2F%3E%3C%2Fsvg%3E"
  },
  {
    "key": "mazinStudentPatience",
    "quote": "One of his greatest strengths as a teacher is his patience. He takes the time to explain every lesson clearly, breaks things down into simple steps, and makes sure you understand before moving on. If you don't understand something the first time, he's always happy to explain it again in a different way until it finally clicks.",
    "name": "A Qur'an Student",
    "country": "Australia",
    "program": "Quran Reading",
    "description": "Student of Brother Mazen",
    "flagImage": "data:image/svg+xml,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20viewBox%3D%220%200%20200%20100%22%3E%3Crect%20width%3D%22200%22%20height%3D%22100%22%20fill%3D%22%23012169%22%2F%3E%3Csvg%20width%3D%22100%22%20height%3D%2250%22%20viewBox%3D%220%200%2060%2030%22%3E%3Cpath%20stroke%3D%22%23fff%22%20stroke-width%3D%226%22%20d%3D%22m0%200%2060%2030m0-30L0%2030%22%2F%3E%3Cpath%20stroke%3D%22%23c8102e%22%20stroke-width%3D%222%22%20d%3D%22m0%200%2060%2030m0-30L0%2030%22%2F%3E%3Cpath%20stroke%3D%22%23fff%22%20stroke-width%3D%2210%22%20d%3D%22M30%200v30M0%2015h60%22%2F%3E%3Cpath%20stroke%3D%22%23c8102e%22%20stroke-width%3D%226%22%20d%3D%22M30%200v30M0%2015h60%22%2F%3E%3C%2Fsvg%3E%3Cpath%20fill%3D%22%23fff%22%20d%3D%22M50.00%2065.00%20L51.87%2071.13%20L57.82%2068.77%20L54.19%2074.04%20L59.75%2077.23%20L53.36%2077.68%20L54.34%2084.01%20L50.00%2079.30%20L45.66%2084.01%20L46.64%2077.68%20L40.25%2077.23%20L45.81%2074.04%20L42.18%2068.77%20L48.13%2071.13Z%22%2F%3E%3Cpath%20fill%3D%22%23fff%22%20d%3D%22M150.00%2013.00%20L151.31%2017.29%20L155.47%2015.64%20L152.93%2019.33%20L156.82%2021.56%20L152.35%2021.88%20L153.04%2026.31%20L150.00%2023.01%20L146.96%2026.31%20L147.65%2021.88%20L143.18%2021.56%20L147.07%2019.33%20L144.53%2015.64%20L148.69%2017.29Z%22%2F%3E%3Cpath%20fill%3D%22%23fff%22%20d%3D%22M125.00%2041.00%20L126.31%2045.29%20L130.47%2043.64%20L127.93%2047.33%20L131.82%2049.56%20L127.35%2049.88%20L128.04%2054.31%20L125.00%2051.01%20L121.96%2054.31%20L122.65%2049.88%20L118.18%2049.56%20L122.07%2047.33%20L119.53%2043.64%20L123.69%2045.29Z%22%2F%3E%3Cpath%20fill%3D%22%23fff%22%20d%3D%22M172.00%2036.00%20L173.31%2040.29%20L177.47%2038.64%20L174.93%2042.33%20L178.82%2044.56%20L174.35%2044.88%20L175.04%2049.31%20L172.00%2046.01%20L168.96%2049.31%20L169.65%2044.88%20L165.18%2044.56%20L169.07%2042.33%20L166.53%2038.64%20L170.69%2040.29Z%22%2F%3E%3Cpath%20fill%3D%22%23fff%22%20d%3D%22M150.00%2073.00%20L151.31%2077.29%20L155.47%2075.64%20L152.93%2079.33%20L156.82%2081.56%20L152.35%2081.88%20L153.04%2086.31%20L150.00%2083.01%20L146.96%2086.31%20L147.65%2081.88%20L143.18%2081.56%20L147.07%2079.33%20L144.53%2075.64%20L148.69%2077.29Z%22%2F%3E%3Cpath%20fill%3D%22%23fff%22%20d%3D%22M162.00%2056.00%20L162.75%2058.45%20L165.13%2057.51%20L163.68%2059.62%20L165.90%2060.89%20L163.34%2061.07%20L163.74%2063.60%20L162.00%2061.72%20L160.26%2063.60%20L160.66%2061.07%20L158.10%2060.89%20L160.32%2059.62%20L158.87%2057.51%20L161.25%2058.45Z%22%2F%3E%3C%2Fsvg%3E"
  },
  {
    "key": "mazinStudentPrayer",
    "quote": "May Allah (SWT) bless him, reward him abundantly for his efforts, and put barakah in his teaching In-Shaa-Allah. Ameen.",
    "name": "A Qur'an Student",
    "country": "Australia",
    "program": "Quran Reading",
    "description": "Student of Brother Mazen",
    "flagImage": "data:image/svg+xml,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20viewBox%3D%220%200%20200%20100%22%3E%3Crect%20width%3D%22200%22%20height%3D%22100%22%20fill%3D%22%23012169%22%2F%3E%3Csvg%20width%3D%22100%22%20height%3D%2250%22%20viewBox%3D%220%200%2060%2030%22%3E%3Cpath%20stroke%3D%22%23fff%22%20stroke-width%3D%226%22%20d%3D%22m0%200%2060%2030m0-30L0%2030%22%2F%3E%3Cpath%20stroke%3D%22%23c8102e%22%20stroke-width%3D%222%22%20d%3D%22m0%200%2060%2030m0-30L0%2030%22%2F%3E%3Cpath%20stroke%3D%22%23fff%22%20stroke-width%3D%2210%22%20d%3D%22M30%200v30M0%2015h60%22%2F%3E%3Cpath%20stroke%3D%22%23c8102e%22%20stroke-width%3D%226%22%20d%3D%22M30%200v30M0%2015h60%22%2F%3E%3C%2Fsvg%3E%3Cpath%20fill%3D%22%23fff%22%20d%3D%22M50.00%2065.00%20L51.87%2071.13%20L57.82%2068.77%20L54.19%2074.04%20L59.75%2077.23%20L53.36%2077.68%20L54.34%2084.01%20L50.00%2079.30%20L45.66%2084.01%20L46.64%2077.68%20L40.25%2077.23%20L45.81%2074.04%20L42.18%2068.77%20L48.13%2071.13Z%22%2F%3E%3Cpath%20fill%3D%22%23fff%22%20d%3D%22M150.00%2013.00%20L151.31%2017.29%20L155.47%2015.64%20L152.93%2019.33%20L156.82%2021.56%20L152.35%2021.88%20L153.04%2026.31%20L150.00%2023.01%20L146.96%2026.31%20L147.65%2021.88%20L143.18%2021.56%20L147.07%2019.33%20L144.53%2015.64%20L148.69%2017.29Z%22%2F%3E%3Cpath%20fill%3D%22%23fff%22%20d%3D%22M125.00%2041.00%20L126.31%2045.29%20L130.47%2043.64%20L127.93%2047.33%20L131.82%2049.56%20L127.35%2049.88%20L128.04%2054.31%20L125.00%2051.01%20L121.96%2054.31%20L122.65%2049.88%20L118.18%2049.56%20L122.07%2047.33%20L119.53%2043.64%20L123.69%2045.29Z%22%2F%3E%3Cpath%20fill%3D%22%23fff%22%20d%3D%22M172.00%2036.00%20L173.31%2040.29%20L177.47%2038.64%20L174.93%2042.33%20L178.82%2044.56%20L174.35%2044.88%20L175.04%2049.31%20L172.00%2046.01%20L168.96%2049.31%20L169.65%2044.88%20L165.18%2044.56%20L169.07%2042.33%20L166.53%2038.64%20L170.69%2040.29Z%22%2F%3E%3Cpath%20fill%3D%22%23fff%22%20d%3D%22M150.00%2073.00%20L151.31%2077.29%20L155.47%2075.64%20L152.93%2079.33%20L156.82%2081.56%20L152.35%2081.88%20L153.04%2086.31%20L150.00%2083.01%20L146.96%2086.31%20L147.65%2081.88%20L143.18%2081.56%20L147.07%2079.33%20L144.53%2075.64%20L148.69%2077.29Z%22%2F%3E%3Cpath%20fill%3D%22%23fff%22%20d%3D%22M162.00%2056.00%20L162.75%2058.45%20L165.13%2057.51%20L163.68%2059.62%20L165.90%2060.89%20L163.34%2061.07%20L163.74%2063.60%20L162.00%2061.72%20L160.26%2063.60%20L160.66%2061.07%20L158.10%2060.89%20L160.32%2059.62%20L158.87%2057.51%20L161.25%2058.45Z%22%2F%3E%3C%2Fsvg%3E"
  }
];

export const reasons: Array<{ key: string; icon: IconName }> = [
  { key: 'qualifiedTeachers', icon: 'user' },
  { key: 'azharBackground', icon: 'landmark' },
  { key: 'simpleApproach', icon: 'messageCircle' },
  { key: 'allLevels', icon: 'star' },
  { key: 'flexibleClasses', icon: 'users' },
  { key: 'parentReports', icon: 'clipboardCheck' },
  { key: 'safeLearning', icon: 'shieldCheck' },
  { key: 'freeTrial', icon: 'gift' },
];

export const howSteps: Array<{ step: string; key: string; icon: IconName }> = [
  { step: '01', key: 'freeTrial', icon: 'gift' },
  { step: '02', key: 'findPlan', icon: 'route' },
  { step: '03', key: 'setSchedule', icon: 'clock' },
  { step: '04', key: 'startLearning', icon: 'book' },
];

export type LandingTeacher = {
  id: string;
  key: string;
  fullName: string;
  specialization: string;
  photo: string;
  photoPosition?: string;
  experience?: string;
  languages?: string[];
};

export const landingTeachers: LandingTeacher[] = [
  {
    id: 'mazin-yasser',
    key: 'mazinYasser',
    fullName: 'Mazin Yasser',
    specialization: "Qur'an, Tajweed, Islamic Studies",
    photo: mazinYasserPhoto,
    photoPosition: 'center 30%',
    experience: '3+ Years',
    languages: ['Arabic', 'English'],
  },
  {
    id: 'fatimah-al-shazly',
    key: 'fatimahAlShazly',
    fullName: 'Fatimah Al Shazly',
    specialization: "Qur'an, Tajweed, Islamic Studies",
    photo: fatimahAlShazlyPhoto,
    photoPosition: 'center 28%',
    experience: '5+ Years',
    languages: ['Arabic', 'English'],
  },
  {
    "id": "ahmed-yasser",
    "key": "ahmedYasser",
    "fullName": "Ahmed Yasser",
    "specialization": "Qur'an, Tajweed, Islamic Studies",
    "experience": "2+ Years",
    "languages": [
      "Arabic",
      "English"
    ],
    "photo": ahmedPortrait,
    "photoPosition": "center"
  },
  {
    "id": "gehad-ragab",
    "key": "gehadRagab",
    "fullName": "Gehad Ragab",
    "specialization": "Qur'an, Tajweed, Islamic Studies",
    "experience": "4+ Years",
    "languages": [
      "Arabic",
      "English"
    ],
    "photo": gehadPortrait,
    "photoPosition": "center"
  },
  {
    "id": "yossef-abd-eltwab",
    "key": "yossefAbdEltwab",
    "fullName": "Yossef Abd Eltwab",
    "specialization": "Qur'an, Tajweed, Islamic Studies",
    "experience": "3+ Years",
    "languages": [
      "Arabic",
      "English"
    ],
    "photo": yossefPortrait,
    "photoPosition": "center"
  },
];

export const trainingIncludes: Array<{ key: string; icon: IconName }> = [
  { key: 'methods', icon: 'graduationCap' },
  { key: 'online', icon: 'video' },
  { key: 'planning', icon: 'clipboardCheck' },
  { key: 'progress', icon: 'barChart3' },
];

export const trainingBadges: Array<{ key: string; icon: IconName }> = [
  { key: 'certificate', icon: 'award' },
  { key: 'mentorship', icon: 'users' },
  { key: 'schedule', icon: 'clock' },
  { key: 'impact', icon: 'trophy' },
];

export const faqs = [
  { key: 'q1' },
  { key: 'q2' },
  { key: 'q3' },
  { key: 'q4' },
  { key: 'q5' },
  { key: 'q6' },
  { key: 'q7' },
  { key: 'q8' },
  { key: 'q9' },
  { key: 'q10' },
];

export const programOptions = programs.map((program) => program.key).concat('teacherTraining');
