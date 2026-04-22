/** Defaults keep GoatCounter off so CI and forks do not hit your counter. Enable via GitHub Actions secret `GOATCOUNTER_SITE_CODE` on deploy. */
export const environment = {
  production: true,
  goatcounter: {
    enabled: false,
    siteCode: '',
  },
};
