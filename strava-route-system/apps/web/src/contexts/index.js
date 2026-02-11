const isDev = process.env.NODE_ENV === 'development'
export const API_ROUTES = {
    getGlobalConfig: isDev
        ? `${process.env.NEXT_PUBLIC_BASE_PATH}/static-api/config-dev.json`
        : `${process.env.NEXT_PUBLIC_DEV_PROXY_PATH}/assets/pwa/config.json`,
    getBanners: `${process.env.NEXT_PUBLIC_DEV_PROXY_PATH}/_api/zh-tw/banner`,
    getAttractions: `${process.env.NEXT_PUBLIC_DEV_PROXY_PATH}/_api/zh-tw/attractions`,
    getShops: `${process.env.NEXT_PUBLIC_DEV_PROXY_PATH}/_api/zh-tw/shops`,
    getAccommodations: `${process.env.NEXT_PUBLIC_DEV_PROXY_PATH}/_api/zh-tw/accommodations`,
    getCrowdInfo: `${process.env.NEXT_PUBLIC_DEV_PROXY_PATH}/_api/zh-tw/neocooler-people-flow`,
    getParkingAvailability: `${process.env.NEXT_PUBLIC_DEV_PROXY_PATH}/_api/zh-tw/neocooler-parking-availability`,
    getPromoteBanner: `${process.env.NEXT_PUBLIC_DEV_PROXY_PATH}/_api/zh-tw/event-slider`,
    getLiveCameras: `${process.env.NEXT_PUBLIC_DEV_PROXY_PATH}/_api/zh-tw/live-footage/`,
    getInstagramData: `${process.env.NEXT_PUBLIC_DEV_PROXY_PATH}/_api/zh-tw/instagram/`,
    getNews: `${process.env.NEXT_PUBLIC_DEV_PROXY_PATH}/_api/zh-tw/news`,
    getUV: `${process.env.NEXT_PUBLIC_DEV_PROXY_PATH}/_api/zh-tw/uv`,
    getAQI: `${process.env.NEXT_PUBLIC_DEV_PROXY_PATH}/_api/zh-tw/aqi`,
    getDistricts: `${process.env.NEXT_PUBLIC_DEV_PROXY_PATH}/_api/zh-tw/zones`,
    getEvents: `${process.env.NEXT_PUBLIC_DEV_PROXY_PATH}/_api/zh-tw/activities`,
    getWeatherData: `${process.env.NEXT_PUBLIC_DEV_PROXY_PATH}/_api/zh-tw/weather-forecast`,
    getWeatherWeekData: `${process.env.NEXT_PUBLIC_DEV_PROXY_PATH}/_api/zh-tw/weather-forecast-week`,
    getTours: `${process.env.NEXT_PUBLIC_DEV_PROXY_PATH}/_api/zh-tw/tours`,
    getSouvenirs: `${process.env.NEXT_PUBLIC_DEV_PROXY_PATH}/_api/zh-tw/souvenirs`,
    getColumns: `${process.env.NEXT_PUBLIC_DEV_PROXY_PATH}/_api/zh-tw/columns`,
    getInformationStations: `${process.env.NEXT_PUBLIC_DEV_PROXY_PATH}/_api/zh-tw/information-station`,
    getFaqs: `${process.env.NEXT_PUBLIC_DEV_PROXY_PATH}/_api/zh-tw/faqs`,
    getPublications: `${process.env.NEXT_PUBLIC_DEV_PROXY_PATH}/_api/zh-tw/publications`,
    getVisitors: `${process.env.NEXT_PUBLIC_DEV_PROXY_PATH}/_api/zh-tw/visitor-center`,
    getVideos: `${process.env.NEXT_PUBLIC_DEV_PROXY_PATH}/_api/zh-tw/videos`,
    getGalleries: `${process.env.NEXT_PUBLIC_DEV_PROXY_PATH}/_api/zh-tw/galleries`,
    getToken: `${process.env.NEXT_PUBLIC_DEV_PROXY_PATH}/_api/xsrf-token`,
    getGuides: `${process.env.NEXT_PUBLIC_DEV_PROXY_PATH}/_api/zh-tw/narrators`,
    sendSuggestion: `${process.env.NEXT_PUBLIC_DEV_PROXY_PATH}/_api/zh-tw/suggest-opinion/`,
    querySuggestions: `${process.env.NEXT_PUBLIC_DEV_PROXY_PATH}/_api/zh-tw/check-opinion`,
    verifySuggestion: `${process.env.NEXT_PUBLIC_DEV_PROXY_PATH}/_api/verify-opinion`,
    getSurveys: `${process.env.NEXT_PUBLIC_DEV_PROXY_PATH}/_api/zh-tw/surveys`,
    sendSurvey: `${process.env.NEXT_PUBLIC_DEV_PROXY_PATH}/_api/zh-tw/handle-survey`,
    getStaticPage: `${process.env.NEXT_PUBLIC_DEV_PROXY_PATH}/_api/zh-tw/pages`,
    getMascotQA: `${process.env.NEXT_PUBLIC_DEV_PROXY_PATH}/_api/zh-tw/ics`,
    getSocialMedia: `${process.env.NEXT_PUBLIC_DEV_PROXY_PATH}/_api/zh-tw/diaries`,
    getBusStop: `${process.env.NEXT_PUBLIC_DEV_PROXY_PATH}/_api/zh-tw/bus-stop`,
    getStores: `${process.env.NEXT_PUBLIC_DEV_PROXY_PATH}/_api/zh-tw/convenience-store`,
    getGasStations: `${process.env.NEXT_PUBLIC_DEV_PROXY_PATH}/_api/zh-tw/gas-station`,
    getApplications: `${process.env.NEXT_PUBLIC_DEV_PROXY_PATH}/_api/zh-tw/online-forms`,
    getApplicationBatch: `${process.env.NEXT_PUBLIC_DEV_PROXY_PATH}/_api/zh-tw/online-form-batch`,
    getToiletFeedback: `${process.env.NEXT_PUBLIC_DEV_PROXY_PATH}/_api/zh-tw/repair-facility/`,
    sendToiletFeedback: `${process.env.NEXT_PUBLIC_DEV_PROXY_PATH}/_api/zh-tw/application-repair-facility/`,
    getNotifications: `${process.env.NEXT_PUBLIC_DEV_PROXY_PATH}/_api/zh-tw/notification`,
    getSunSet: `${process.env.NEXT_PUBLIC_DEV_PROXY_PATH}/_api/zh-tw/sun-time`,
    getMoonRise: `${process.env.NEXT_PUBLIC_DEV_PROXY_PATH}/_api/zh-tw/moon-time`,
    getNotification: `${process.env.NEXT_PUBLIC_DEV_PROXY_PATH}/_api/zh-tw/notification/`,
    getThsrStation: `${process.env.NEXT_PUBLIC_DEV_PROXY_PATH}/_api/thsr-station`,
    getThsrDailyTimetableByFromToStation: `${process.env.NEXT_PUBLIC_DEV_PROXY_PATH}/_api/thsr-daily-timetable-by-from-to-station`,
    getThsrDailyTimetableByDateAndStation: `${process.env.NEXT_PUBLIC_DEV_PROXY_PATH}/_api/thsr-daily-timetable-by-date-and-station`,
    getTraStation: `${process.env.NEXT_PUBLIC_DEV_PROXY_PATH}/_api/tra-station`,
    getTraDailyTimetableByFromToStation: `${process.env.NEXT_PUBLIC_DEV_PROXY_PATH}/_api/tra-daily-timetable-by-from-to-station`,
    getThsrDailyTimetableByFromToStation: `${process.env.NEXT_PUBLIC_DEV_PROXY_PATH}/_api/thsr-daily-timetable-by-from-to-station`,
    getTraLiveBoardByStation: `${process.env.NEXT_PUBLIC_DEV_PROXY_PATH}/_api/tra-live-board-by-station`,
    getToilets: `${process.env.NEXT_PUBLIC_DEV_PROXY_PATH}/_api/zh-tw/toilet`,
    getHospitals: `${process.env.NEXT_PUBLIC_DEV_PROXY_PATH}/_api/zh-tw/healthcare-facility`,
    getPoliceStations: `${process.env.NEXT_PUBLIC_DEV_PROXY_PATH}/_api/zh-tw/police`,
    getBikeStations: `${process.env.NEXT_PUBLIC_DEV_PROXY_PATH}/_api/zh-tw/bike-station`,
    getAtms: `${process.env.NEXT_PUBLIC_DEV_PROXY_PATH}/_api/zh-tw/atm`,
    getParkingToken: `${process.env.NEXT_PUBLIC_DEV_PROXY_PATH}/_api/parking-magi`,
    getPoliceStations: `${process.env.NEXT_PUBLIC_DEV_PROXY_PATH}/_api/zh-tw/police-station`,
    getDistrictDataByLatLng: `${process.env.NEXT_PUBLIC_DEV_PROXY_PATH}/_api/parse-district`,
    getNavigationAreas: `${process.env.NEXT_PUBLIC_DEV_PROXY_PATH}/_api/zh-tw/navigation-areas`,
    getNavigationIntro: `${process.env.NEXT_PUBLIC_DEV_PROXY_PATH}/_api/zh-tw/navigation-intro`,
    getCrowdFlowInfo: `${process.env.NEXT_PUBLIC_DEV_PROXY_PATH}/_api/zh-tw/people-traffic-flow`,
    getVisitorCenterParkingInfo: `${process.env.NEXT_PUBLIC_DEV_PROXY_PATH}/_api/zh-tw/guantian-visitor-center-parking`,
    getTraStations: `${process.env.NEXT_PUBLIC_DEV_PROXY_PATH}/_api/tra-station`,
    getThsrStations: `${process.env.NEXT_PUBLIC_DEV_PROXY_PATH}/_api/thsr-station`,
    getOta: `${process.env.NEXT_PUBLIC_DEV_PROXY_PATH}/_api/zh-tw/online-travel-agency`,
    getImmersiveExperience: `${process.env.NEXT_PUBLIC_DEV_PROXY_PATH}/_api/zh-tw/immersive-experience`,
    getDigitalTwin: `${process.env.NEXT_PUBLIC_DEV_PROXY_PATH}/_api/zh-tw/digital-twin`
}

export const MENU_CONFIG = [
    {
        title: '首頁',
        url: '/',
        icon: 'menu-01',
        keywords: ['/']
    },
    {
        title: '探索',
        url: '/explore/',
        icon: 'menu-02',
        keywords: ['explore', 'attraction']
    },
    {
        title: '導覽',
        url: '/guide/',
        icon: 'menu-03',
        keywords: ['guide']
    },
    {
        title: '交通',
        url: '/transport/',
        icon: 'menu-04',
        keywords: ['transport']
    },
    {
        title: '旅服',
        url: '/service/',
        icon: 'menu-05',
        keywords: ['service']
    }
]

export const MAP_NEAR_BTN_CONFIG = [
    {
        title: '公車站牌',
        type: 'bus-stop',
        api: API_ROUTES.getBusStops,
        range: 1,
        iconClx: 'text-[20px]'
    },
    {
        title: '公廁',
        type: 'toilet',
        api: API_ROUTES.getToilets,
        range: 0.5,
        iconClx: 'text-[20px]'
    },
    {
        title: '停車場',
        type: 'parking',
        range: 1,
        iconClx: 'text-[18px]'
    },
    {
        title: '加油站',
        type: 'gas',
        api: API_ROUTES.getGasStations,
        range: 3,
        iconClx: 'text-[18px]'
    }
    /* {
        title: '旅客中心',
        type: 'service-center',
        api: API_ROUTES.getServiceCenters,
        range: 1,
        size: 22
    },
    {
        title: '便利商店',
        type: 'store',
        api: API_ROUTES.getStores,
        range: 1,
        size: 20
    },
     */
]
export const TOUR_DAY_CONFIG = [
    { value: 0.5, name: '半日遊' },
    { value: 1, name: '一日遊' },
    { value: 2, name: '二日遊' },
    { value: 3, name: '三日遊' }
]
export const TOUR_SEASON_CONFIG = [
    { value: 1, name: '春季' },
    { value: 2, name: '夏季' },
    { value: 3, name: '秋季' },
    { value: 4, name: '冬季' }
]

export const WEEKDAYS = ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT']

//台中霧峰區
export const DEFAULT_LOCATION = {
    lat: 24.0582781,
    lng: 120.6957577
}

export const COUNTY_CONFIG = [
    { id: 0, name: '嘉義' },
    {
        id: 1,
        name: '臺南'
    }
]

export const NEARBY_SPOT_CONFIG = [
    { title: '停車場', type: 'parking', range: 3 },
    { title: '廁所', type: 'toilet', range: 1 },
    { title: '公車站牌', type: 'bus-stop', range: 2 },
    { title: 'ATM', type: 'atm', range: 1 },
    { title: '加油站', type: 'gas', range: 1 },
    { title: '超商', type: 'store', range: 1 },
    { title: '警察局', type: 'police', range: 1 },
    { title: '醫療院所', type: 'hospital', range: 10 },
    { title: '自行車租借站', type: 'bike', range: 1 }
]

export const VALID_DISTRICT_ZIPCODES = [
    300, 302, 303, 304, 305, 306, 307, 308, 310, 311, 312, 315, 350, 351, 352,
    353, 354, 356, 357, 358, 360, 361, 362, 363, 364, 365, 366, 367, 368, 369,
    400, 401, 402, 403, 404, 406, 407, 408, 411, 412, 413, 420, 421, 422, 423,
    424, 426, 427, 428, 429, 432, 433, 434, 435, 437, 438, 439, 500, 502, 503,
    504, 505, 507, 508, 509, 510, 511, 512, 513, 514, 515, 516, 520, 521, 523,
    525, 530, 540, 541, 542, 544, 545, 546, 553, 555, 556, 557, 558, 600, 603,
    604, 605, 606, 607, 608, 611, 612, 613, 614, 615, 616, 622, 623, 624, 625,
    630, 632, 633, 634, 635, 636, 637, 638, 639, 640, 643, 644, 645, 646, 648,
    651, 652, 653, 654, 655
]

export const COUNTY_DISTRICT_CONFIG = [
    {
        county: '新竹縣',
        districts: [
            { name: '竹北市', zipcode: '302' },
            { name: '竹東鎮', zipcode: '310' },
            { name: '新埔鎮', zipcode: '305' },
            { name: '關西鎮', zipcode: '307' },
            { name: '新豐鄉', zipcode: '304' },
            { name: '峨眉鄉', zipcode: '315' },
            { name: '寶山鄉', zipcode: '308' },
            { name: '五峰鄉', zipcode: '312' },
            { name: '北埔鄉', zipcode: '306' },
            { name: '尖石鄉', zipcode: '311' },
            { name: '芎林鄉', zipcode: '303' },
            { name: '湖口鄉', zipcode: '303' }
        ]
    },
    {
        county: '新竹市',
        districts: [
            { name: '東區', zipcode: '300' },
            { name: '北區', zipcode: '300' },
            { name: '香山區', zipcode: '300' }
        ]
    },
    {
        county: '苗栗縣',
        districts: [
            { name: '苗栗市', zipcode: '360' },
            { name: '竹南鎮', zipcode: '350' },
            { name: '頭份市', zipcode: '351' },
            { name: '後龍鎮', zipcode: '356' },
            { name: '通霄鎮', zipcode: '357' },
            { name: '苑裡鎮', zipcode: '358' },
            { name: '卓蘭鎮', zipcode: '369' },
            { name: '三灣鄉', zipcode: '352' },
            { name: '南庄鄉', zipcode: '353' },
            { name: '造橋鄉', zipcode: '361' },
            { name: '獅潭鄉', zipcode: '354' },
            { name: '頭屋鄉', zipcode: '362' },
            { name: '西湖鄉', zipcode: '363' },
            { name: '公館鄉', zipcode: '364' },
            { name: '銅鑼鄉', zipcode: '365' },
            { name: '泰安鄉', zipcode: '366' },
            { name: '大湖鄉', zipcode: '367' },
            { name: '三義鄉', zipcode: '368' }
        ]
    },
    {
        county: '臺中市',
        districts: [
            { name: '中區', zipcode: '400' },
            { name: '東區', zipcode: '401' },
            { name: '西區', zipcode: '403' },
            { name: '南區', zipcode: '402' },
            { name: '北區', zipcode: '404' },
            { name: '西屯區', zipcode: '407' },
            { name: '南屯區', zipcode: '408' },
            { name: '北屯區', zipcode: '406' },
            { name: '豐原區', zipcode: '420' },
            { name: '大里區', zipcode: '412' },
            { name: '太平區', zipcode: '411' },
            { name: '清水區', zipcode: '435' },
            { name: '沙鹿區', zipcode: '433' },
            { name: '大甲區', zipcode: '437' },
            { name: '東勢區', zipcode: '423' },
            { name: '梧棲區', zipcode: '435' },
            { name: '烏日區', zipcode: '414' },
            { name: '神岡區', zipcode: '429' },
            { name: '大肚區', zipcode: '432' },
            { name: '大雅區', zipcode: '428' },
            { name: '后里區', zipcode: '421' },
            { name: '霧峰區', zipcode: '413' },
            { name: '潭子區', zipcode: '427' },
            { name: '龍井區', zipcode: '434' },
            { name: '外埔區', zipcode: '438' },
            { name: '和平區', zipcode: '424' },
            { name: '石岡區', zipcode: '422' },
            { name: '大安區', zipcode: '439' },
            { name: '新社區', zipcode: '426' }
        ]
    },
    {
        county: '彰化縣',
        districts: [
            { name: '彰化市', zipcode: '500' },
            { name: '員林市', zipcode: '510' },
            { name: '鹿港鎮', zipcode: '505' },
            { name: '和美鎮', zipcode: '503' },
            { name: '北斗鎮', zipcode: '521' },
            { name: '溪湖鎮', zipcode: '514' },
            { name: '田中鎮', zipcode: '520' },
            { name: '線西鄉', zipcode: '504' },
            { name: '伸港鄉', zipcode: '507' },
            { name: '福興鄉', zipcode: '508' },
            { name: '秀水鄉', zipcode: '509' },
            { name: '花壇鄉', zipcode: '502' },
            { name: '大村鄉', zipcode: '511' },
            { name: '埔鹽鄉', zipcode: '512' },
            { name: '埔心鄉', zipcode: '513' },
            { name: '永靖鄉', zipcode: '515' },
            { name: '社頭鄉', zipcode: '516' },
            { name: '二水鄉', zipcode: '530' },
            { name: '竹塘鄉', zipcode: '523' },
            { name: '溪州鄉', zipcode: '525' }
        ]
    },
    {
        county: '南投縣',
        districts: [
            { name: '南投市', zipcode: '540' },
            { name: '中寮鄉', zipcode: '541' },
            { name: '草屯鎮', zipcode: '542' },
            { name: '國姓鄉', zipcode: '544' },
            { name: '埔里鎮', zipcode: '545' },
            { name: '仁愛鄉', zipcode: '546' },
            { name: '名間鄉', zipcode: '558' },
            { name: '集集鎮', zipcode: '553' },
            { name: '水里鄉', zipcode: '553' },
            { name: '魚池鄉', zipcode: '555' },
            { name: '信義鄉', zipcode: '556' },
            { name: '竹山鎮', zipcode: '557' },
            { name: '鹿谷鄉', zipcode: '558' }
        ]
    },
    // {
    //     county: '雲林縣',
    //     districts: [
    //         { name: '斗南鎮', zipcode: '630' },
    //         { name: '大埤鄉', zipcode: '633' },
    //         { name: '虎尾鎮', zipcode: '632' },
    //         { name: '土庫鎮', zipcode: '634' },
    //         { name: '褒忠鄉', zipcode: '635' },
    //         { name: '東勢鄉', zipcode: '636' },
    //         { name: '臺西鄉', zipcode: '637' },
    //         { name: '崙背鄉', zipcode: '638' },
    //         { name: '麥寮鄉', zipcode: '639' },
    //         { name: '斗六市', zipcode: '640' },
    //         { name: '林內鄉', zipcode: '643' },
    //         { name: '古坑鄉', zipcode: '646' },
    //         { name: '莿桐鄉', zipcode: '645' },
    //         { name: '西螺鎮', zipcode: '648' },
    //         { name: '二崙鄉', zipcode: '644' },
    //         { name: '北港鎮', zipcode: '651' },
    //         { name: '水林鄉', zipcode: '652' },
    //         { name: '口湖鄉', zipcode: '653' },
    //         { name: '四湖鄉', zipcode: '654' },
    //         { name: '元長鄉', zipcode: '655' }
    //     ]
    // },
    {
        county: '嘉義縣',
        districts: [
            { name: '番路鄉', zipcode: '608' },
            { name: '梅山鄉', zipcode: '604' },
            { name: '竹崗鄉', zipcode: '603' },
            { name: '阿里山鄉', zipcode: '605' },
            { name: '中埔鄉', zipcode: '606' },
            { name: '大埔鄉', zipcode: '607' },
            { name: '水上鄉', zipcode: '608' },
            { name: '鹿草鄉', zipcode: '611' },
            { name: '太保市', zipcode: '612' },
            { name: '朴子市', zipcode: '613' },
            { name: '東石鄉', zipcode: '614' },
            { name: '六腳鄉', zipcode: '615' },
            { name: '新港鄉', zipcode: '616' },
            { name: '民雄鄉', zipcode: '622' },
            { name: '大林鎮', zipcode: '622' },
            { name: '溪口鄉', zipcode: '623' },
            { name: '義竹鄉', zipcode: '624' },
            { name: '布袋鎮', zipcode: '625' }
        ]
    },
    {
        county: '嘉義市',
        districts: [
            { name: '東區', zipcode: '600' },
            { name: '西區', zipcode: '600' }
        ]
    }
]

export const TRAIN_TAIWAN_DISTRICTS = [
    { name: '臺北市', enName: 'Taipei City', thrs: true },
    {
        name: '基隆市',
        enName: 'Keelung County'
    },
    {
        name: '新北市',
        enName: 'New Taipei City',
        thrs: true
    },
    {
        name: '宜蘭縣',
        enName: 'Yilan County'
    },
    {
        name: '新竹市',
        enName: 'Hsinchu City'
    },
    {
        name: '新竹縣',
        enName: 'Hsinchu County',
        thrs: true
    },
    {
        name: '桃園市',
        enName: 'Taoyuan City',
        thrs: true
    },
    {
        name: '苗栗縣',
        enName: 'Miaoli County',
        thrs: true
    },
    {
        name: '臺中市',
        enName: 'Taichung City',
        thrs: true
    },
    {
        name: '彰化縣',
        enName: 'Zhanghua County',
        thrs: true
    },
    {
        name: '南投縣',
        enName: 'Nantou County'
    },
    {
        name: '嘉義市',
        enName: 'Chiayi City'
    },
    {
        name: '嘉義縣',
        enName: 'Chiayi County',
        thrs: true
    },
    {
        name: '雲林縣',
        enName: 'Chiayi County',
        thrs: true
    },
    {
        name: '臺南市',
        enName: 'Tainan City',
        thrs: true
    },
    {
        name: '高雄市',
        enName: 'Kaohsiung City',
        thrs: true
    },
    {
        name: '屏東縣',
        enName: 'Pingtung County'
    },
    {
        name: '臺東縣',
        enName: 'Taitung County'
    },
    {
        name: '花蓮縣',
        enName: 'Hualien County'
    }
]

export const EVENT_CONFIG = [
    { id: 0, name: '正在舉行' },
    { id: 1, name: '即將舉行' }
]

export const SORT_CONFIG = [
    { id: 0, name: '距離較近' },
    { id: 1, name: '熱門度' }
]

export const NATIONAL_PARK_CONFIG = [
    {
        id: 144,
        name: '參山國家風景區',
        abbr: '參山',
        type: 'trimt',
        districts: [
            { name: '北埔鄉', zipcode: '314' },
            { name: '峨眉鄉', zipcode: '315' },
            { name: '三灣鄉', zipcode: '352' },
            { name: '南庄鄉', zipcode: '353' },
            { name: '霧峰區', zipcode: '413' },
            { name: '和平區', zipcode: '424' },
            { name: '彰化市', zipcode: '500' },
            { name: '芬園鄉', zipcode: '502' },
            { name: '花壇鄉', zipcode: '503' },
            { name: '員林市', zipcode: '510' },
            { name: '社頭鄉', zipcode: '511' },
            { name: '田中鎮', zipcode: '520' },
            { name: '二水鄉', zipcode: '530' },
            { name: '南投市', zipcode: '540' },
            { name: '名間鄉', zipcode: '551' }
        ]
    },
    {
        id: 145,
        type: 'ali',
        name: '阿里山國家風景區',
        abbr: '阿里山',
        districts: [
            { name: '番路鄉', zipcode: '608' },
            { name: '梅山鄉', zipcode: '604' },
            { name: '竹崎鄉', zipcode: '603' },
            { name: '阿里山鄉', zipcode: '605' }
        ]
    },
    {
        id: 146,
        type: 'sun-moon-lake',
        name: '日月潭國家風景區',
        abbr: '日月潭',
        districts: [
            { name: '國姓鄉', zipcode: '544' },
            { name: '埔里鎮', zipcode: '545' },
            { name: '集集鎮', zipcode: '553' },
            { name: '水里鄉', zipcode: '553' },
            { name: '魚池鄉', zipcode: '555' },
            { name: '信義鄉', zipcode: '556' }
        ]
    }
]
