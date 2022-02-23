const Insta = require('./test.js');

class InstaSaver {
  constructor() {
    this.insta = new Insta(process.env.INSTA_SESSION_ID);
  }

  getShortcodeFromUrl(url) {
    return url.replace('https://www.instagram.com/p/', '').split('/')[0];
  }

  async getImageUrl(shortcode) {
    const candidates = await this.insta.getPostImageUrls(shortcode);
    if (candidates && candidates.length) {
      return candidates.reduce((prev, current) => {
        return (prev.width > current.width) ? prev : current;
      }, {});
    }
  }

  async download(url) {
    const shortcode = this.getShortcodeFromUrl(url);
    console.log({ shortcode });
    const data = await this.getImageUrl(shortcode);
    return data.url;
  }
}

module.exports = InstaSaver;
