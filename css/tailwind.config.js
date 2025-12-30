/**
 * Tailwind CSS 配置檔案
 * 自訂企業主題色彩
 */
tailwind.config = {
  theme: {
    extend: {
      colors: {
        // 企業主色 (Corporate Blue)
        corp: {
          50: '#f0f9ff',
          100: '#e0f2fe',
          600: '#0284c7',
          800: '#075985'
        }
      },
      // 可擴展的自訂間距
      spacing: {
        '128': '32rem',
        '144': '36rem',
      },
      // 自訂字體大小
      fontSize: {
        'xxs': '0.625rem', // 10px
      },
      // 自訂動畫時間
      transitionDuration: {
        '400': '400ms',
      }
    }
  }
}
