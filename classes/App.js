import { showNotification } from '../modules/showNotification.js';
import axios from 'axios';

export default class App {
  constructor(root) {
    // 🚀 Props
    this.root = root;
    this.searchResults = [];
    this.storedResults = this.storageGet();

    // 🚀 Render Skeleton
    this.root.innerHTML = `
    <h3 class='title'>Anime Tracker</h3>
    <div class='content'>
      <form data-form='' class='row'>
        <input type='text' name='query' placeholder='Enter anime name'>
        <button type='submit'>Search</button>
      </form>
      <ul class='search row hide' data-search=''></ul>
      <ul class='stored row hide' data-stored=''></ul>
    </div>
    `;

    // 🚀 Query Selectors
    this.DOM = {
      form: document.querySelector('[data-form]'),
      searchList: document.querySelector('[data-search]'),
      storedList: document.querySelector('[data-stored]'),
    };

    // 🚀 Events Listeners
    this.storageDisplay();
    this.DOM.form.addEventListener('submit', this.onSubmit);
    this.DOM.searchList.addEventListener('click', this.onSearchClick);
    this.DOM.storedList.addEventListener('click', this.onStoredClick);
  }

  //===============================================
  // 🚀 Methods
  //===============================================
  /**
   * @function storageDisplay - Get and display data from local storage
   */
  storageDisplay = () => {
    const storedList = this.storageGet();
    if (storedList.length === 0) {
      this.DOM.storedList.classList.add('hide');
      return;
    }
    this.DOM.storedList.classList.remove('hide');
    this.renderStore(storedList);
  };
  //===============================================
  /**
   * @function storageGet - Get data from local storage
   * @returns {any|*[]}
   */
  storageGet = () => {
    return localStorage.getItem('anime') ? JSON.parse(localStorage.getItem('anime')) : [];
  };

  //===============================================
  /**
   * @function renderStore - Render stored items HTML
   * @param data
   */
  renderStore = (data) => {
    this.DOM.storedList.innerHTML = '';

    for (const { img, title, id, episodes, episodesFinish } of data) {
      const li = document.createElement('li');

      li.innerHTML = `
        <div class='header'>
          <img src='${img}' alt='${title}'>
          <h3 class='h5'><a href='https://myanimelist.net/anime/${id}/${title}' target='_blank'>${title}</a></h3>
        </div>
        <div class='body' data-id='${id}'>
          <div class='episodes'>
            <span data-finished=''>${episodesFinish}</span>/
            <span data-all-episodes=''>${episodes}</span>
          </div>
          <div class='buttons'>
            <button data-plus=''>+</button>
            <button data-minus=''>-</button>
            <button data-trash='${id}'>Remove</button>
          </div>
        </div>
      `;
      this.DOM.storedList.append(li);

      // li.querySelector('[data-trash]')
    }
  };

  //===============================================
  /**
   * @function onSubmit - Form submit event handler
   * @param event
   */
  onSubmit = (event) => {
    event.preventDefault();
    const form = event.target;
    const query = Object.fromEntries(new FormData(form).entries()).query.trim().toLowerCase();

    if (query.length === 0) {
      showNotification('warning', 'Please fill the field.');
      return;
    }

    this.fetchAnime(query);
  };

  //===============================================
  /**
   * @function fetchAnime - Fetch anime from API
   * @param query
   * @returns {Promise<void>}
   */
  fetchAnime = async (query) => {
    try {
      this.DOM.form.querySelector('button').textContent = 'Loading...';
      const { data: { data } } = await axios.get(`https://api.jikan.moe/v4/anime?q=${query}`);
      this.searchResults = data;

      if (this.searchResults.length === 0) {
        showNotification('danger', 'Something went wrong, open developer console.');
        this.DOM.form.querySelector('button').textContent = 'Search';
        return;
      }

      this.renderHTML(this.searchResults);

      this.DOM.form.querySelector('button').textContent = 'Search';
    } catch (e) {
      showNotification('danger', 'Something went wrong, open developer console.');
      this.DOM.form.querySelector('button').textContent = 'Search';
      console.log(e);
    }
  };

  //===============================================
  /**
   * @function renderHTML - Render search result HTML
   * @param data
   */
  renderHTML = (data) => {
    this.DOM.searchList.classList.remove('hide');
    this.DOM.searchList.innerHTML = ``;

    for (const anime of data) {
      const li = document.createElement('li');
      li.setAttribute('data-id', anime.mal_id);
      li.innerHTML = `
        <div class='header'>
          <img src='${anime.images.jpg.image_url}' alt='${anime.title}'>
        </div>
        <div class='body'>
          <h3 class='h6'>
            <a href='https://myanimelist.net/anime/${anime.mal_id}/${anime.title}' target='_blank'>
              ${anime.title}
            </a>
          </h3>
          <button data-add='${JSON.stringify({
        episodes: anime.episodes,
        title: anime.title,
        id: anime.mal_id,
        img: anime.images.jpg.image_url,
      })}'
          >Add To List</button>
        </div>`;

      li.querySelector('button').disabled = this.storedResults.find(({ id }) => id === anime.mal_id);
      this.DOM.searchList.appendChild(li);
    }
  };

  //===============================================
  /**
   * @function onSearchClick - Add item to stored list
   * @param target
   */
  onSearchClick = ({ target }) => {
    if (target.matches('[data-add]')) {
      target.disabled = true;
      const { episodes, title, id, img } = JSON.parse(target.dataset.add);
      this.storedResults = [...this.storedResults, { episodes, title, id, img, episodesFinish: 0 }];
      this.DOM.storedList.classList.remove('hide');
      this.storageSet(this.storedResults);
      this.renderStore(this.storedResults);
    }
  };

  //===============================================
  /**
   * @function storageSet - Set data to local storage
   * @param data
   */
  storageSet = (data) => {
    return localStorage.setItem('anime', JSON.stringify(data));
  };

  //===============================================
  /**
   * @function onStoredClick - Store click event handler
   * @param target
   */
  onStoredClick = ({ target }) => {
    // Increase Counter
    if (target.matches('[data-plus]')) {
      const body = target.closest('.body');
      const watchedCount = body.querySelector('[data-finished]');
      const episodesFinish = body.querySelector('[data-all-episodes]');
      let watchedCountValue = parseInt(watchedCount.textContent);

      if (watchedCountValue !== parseInt(episodesFinish.textContent)) {
        watchedCountValue++;
        watchedCount.innerHTML = watchedCountValue;

        this.storedResults = this.storedResults.map(anime => anime.id === parseInt(body.dataset.id) ? {
          ...anime,
          episodesFinish: watchedCountValue,
        } : anime);
        this.storageSet(this.storedResults);
      }
    }

    // Decrease Counter
    if (target.matches('[data-minus]')) {
      const body = target.closest('.body');
      const watchedCount = body.querySelector('[data-finished]');
      let watchedCountValue = parseInt(watchedCount.textContent);

      if (watchedCountValue !== 0) {
        watchedCountValue--;
        watchedCount.innerHTML = watchedCountValue;

        this.storedResults = this.storedResults.map(anime => anime.id === parseInt(body.dataset.id) ? {
          ...anime,
          episodesFinish: watchedCountValue,
        } : anime);

        this.storageSet(this.storedResults);
      }
    }

    // Delete Item
    if (target.matches('[data-trash]')) {
      if (confirm('Are you sure?')) {
        const ID = parseInt(target.dataset.trash);
        const searchItems = Array.from(this.DOM.searchList.querySelectorAll('li'));
        target.closest('li').remove();
        this.storedResults = this.storedResults.filter(({ id }) => id !== ID);
        this.storageSet(this.storedResults);
        this.renderStore(this.storedResults);

        if (this.storedResults.length === 0) {
          this.DOM.storedList.classList.add('hide');
        }

        if (searchItems.length !== 0) {
          searchItems.forEach(li => {
            if (parseInt(li.dataset.id) === ID) {
              li.querySelector('button').disabled = false;
            }
          });
        }
      }
    }
  };
}
