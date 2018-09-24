var dbPromise;
class DBHelper {

  static openDatabase(store) {
    return idb.open(store, 1, function (upgradeDb) {
      var autoIncrement = false
      if (store == "storedReviews") {
        autoIncrement = true
      }
      upgradeDb.createObjectStore(store, {
        keyPath: 'id',
        autoIncrement: autoIncrement
      });
    });
  }

  static get RESTAURANT_URL() {
    const port = 1337; // Change this to your server port
    return `http://localhost:${port}/restaurants`;
  }

  static get REVEIW_URL() {
    const port = 1337; // Change this to your server port
    return `http://localhost:${port}/reviews`;
  }

  // check if current request has been stored in db
  static checkDB(store) {
    dbPromise = DBHelper.openDatabase(store);
    return dbPromise.then(function (db) {
      if (!db) return;

      var tx = db.transaction(store, 'readwrite');
      var tempStore = tx.objectStore(store);

      return tempStore.getAll();

    });
  }

  //get restaurant data
  static fetchRestaurants(callback) {
    DBHelper.checkDB('restaurants').then(function (data) {
      // if checkDB returned any data, return that data

      if (data.length > 0) {
        return callback(null, data);
      }
      // if checkDB didn't return any data fetch the data and store it in the db
      fetch(DBHelper.RESTAURANT_URL)
        .then(response => {
          return response.json()
        })
        .then(data => {
          dbPromise.then(function (db) {
            if (!db) return db;

            var tx = db.transaction('restaurants', 'readwrite');
            var restaurants = tx.objectStore('restaurants');

            data.forEach(restaurant => restaurants.put(restaurant));
          });
          return callback(null, data);
        })
        .catch(err => {
          return callback(err, null)
        });
    });
  }

  //get restaurant data
  static fetchReviews(id, callback) {
    DBHelper.checkDB('reviews').then(function (data) {
      // if checkDB returned any data, return that data
      if (data.length > 0) {
        data = data.filter(r => r.restaurant_id == id);
        return callback(null, data);
      }
      // if checkDB didn't return any data fetch the data and store it in the db
      fetch(DBHelper.REVEIW_URL + "/?restaurant_id=" + parseInt(id))
        .then(response => {
          return response.json()
        })
        .then(data => {
          dbPromise.then(function (db) {
            if (!db) return db;

            var tx = db.transaction('reviews', 'readwrite');
            var reviews = tx.objectStore('reviews');

            data.forEach(review => reviews.put(review));
          });
          return callback(null, data);
        })
        .catch(err => {
          return callback(err, null)
        });

    });
  }


  /**
   * Fetch a restaurant by its ID.
   */
  static fetchRestaurantById(id, callback) {
    // fetch all restaurants with proper error handling.
    DBHelper.fetchRestaurants((error, restaurants) => {
      if (error) {
        callback(error, null);
      } else {
        const restaurant = restaurants.find(r => r.id == id);
        if (restaurant) { // Got the restaurant
          callback(null, restaurant);
        } else { // Restaurant does not exist in the database
          callback('Restaurant does not exist', null);
        }
      }
    });
  }

  /**
   * Fetch restaurants by a cuisine type with proper error handling.
   */
  static fetchRestaurantByCuisine(cuisine, callback) {
    // Fetch all restaurants  with proper error handling
    DBHelper.fetchRestaurants((error, restaurants) => {
      if (error) {
        callback(error, null);
      } else {
        // Filter restaurants to have only given cuisine type
        const results = restaurants.filter(r => r.cuisine_type == cuisine);
        callback(null, results);
      }
    });
  }

  /**
   * Fetch restaurants by a neighborhood with proper error handling.
   */
  static fetchRestaurantByNeighborhood(neighborhood, callback) {
    // Fetch all restaurants
    DBHelper.fetchRestaurants((error, restaurants) => {
      if (error) {
        callback(error, null);
      } else {
        // Filter restaurants to have only given neighborhood
        const results = restaurants.filter(r => r.neighborhood == neighborhood);
        callback(null, results);
      }
    });
  }

  /**
   * Fetch restaurants by a cuisine and a neighborhood with proper error handling.
   */
  static fetchRestaurantByCuisineAndNeighborhood(cuisine, neighborhood, callback) {
    // Fetch all restaurants
    DBHelper.fetchRestaurants((error, restaurants) => {
      if (error) {
        callback(error, null);
      } else {
        let results = restaurants
        if (cuisine != 'all') { // filter by cuisine
          results = results.filter(r => r.cuisine_type == cuisine);
        }
        if (neighborhood != 'all') { // filter by neighborhood
          results = results.filter(r => r.neighborhood == neighborhood);
        }
        callback(null, results);
      }
    });
  }

  /**
   * Fetch all neighborhoods with proper error handling.
   */
  static fetchNeighborhoods(callback) {
    // Fetch all restaurants
    DBHelper.fetchRestaurants((error, restaurants) => {
      if (error) {
        callback(error, null);
      } else {
        // Get all neighborhoods from all restaurants
        const neighborhoods = restaurants.map((v, i) => restaurants[i].neighborhood)
        // Remove duplicates from neighborhoods
        const uniqueNeighborhoods = neighborhoods.filter((v, i) => neighborhoods.indexOf(v) == i)
        callback(null, uniqueNeighborhoods);
      }
    });
  }

  /**
   * Fetch all cuisines with proper error handling.
   */
  static fetchCuisines(callback) {
    // Fetch all restaurants
    DBHelper.fetchRestaurants((error, restaurants) => {
      if (error) {
        callback(error, null);
      } else {
        // Get all cuisines from all restaurants
        const cuisines = restaurants.map((v, i) => restaurants[i].cuisine_type)
        // Remove duplicates from cuisines
        const uniqueCuisines = cuisines.filter((v, i) => cuisines.indexOf(v) == i)
        callback(null, uniqueCuisines);
      }
    });
  }

  /**
   * Restaurant page URL.
   */
  static urlForRestaurant(restaurant) {
    return (`./restaurant.html?id=${restaurant.id}`);
  }

  /**
   * Restaurant image URL.
   */
  static imageUrlForRestaurant(restaurant) {
    return (`/img/${restaurant.photograph}`);
  }

  /**
   * Loading image URL.
   */
  static loadingImage() {
    return (`/img/loading.svg`);
  }

  static toggleFavorite(id) {
    var newVal
    DBHelper.checkDB('restaurants').then(function (data) {
      dbPromise.then(function (db) {
        var tx = db.transaction('restaurants', 'readwrite');
        var restaurants = tx.objectStore('restaurants');
        restaurants.get(id).then(function (restaurant) {
          newVal = restaurant.is_favorite ? false : true;
          restaurant.is_favorite = newVal
          restaurants.put(restaurant);
          DBHelper.setFavoriteServer(id, newVal)
          return tx.complete;
        });
      })
    });
  };

  static setFavoriteServer(id, is_favorite) {
    var url = DBHelper.RESTAURANT_URL + '/' + id + '/'
    var newImg;
    if (is_favorite) {
      newImg = 'img/favorite_filled.svg'
    } else {
      newImg = 'img/favorite_outline.svg'
    }
    fetch(url, {
        method: 'PUT',
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          "is_favorite": is_favorite
        })

      }).then(res => res.json())
      .then(response => console.log(is_favorite + ' | Success:', JSON.stringify(response)))
      .catch(error => console.error('Error:', error));
    var target = document.getElementById("is_favorite_img_" + id)
    target.setAttribute("src", newImg);
  }

  static submitReview() {
    var id = parseInt(getParameterByName("id")),
      name = document.getElementById("review-name").value,
      rating = document.getElementById("review-rating").value,
      comments = document.getElementById("review-comment").value;
    if (name.length == 0 || rating.length == 0 || comments.length == 0) {
      document.getElementById("review-message").innerHTML = "<div class='error-message'>All fields are required.</div>";
      return false;
    }
    if (rating < 1 || rating > 5) {
      document.getElementById("review-message").innerHTML = "<div class='error-message'>Ratings must be between 1 and 5.</div>";
      return false;
    }
    if (!checkConnectivity()) {
      document.getElementById("review-message").innerHTML = "<div class='info-message'>Uh oh, looks like you're offline, this review will be submitted when you're back online.</div>";
      DBHelper.deferReview(id, name, rating, comments);
    } else {
      fetch(DBHelper.REVEIW_URL + '/', {
          method: 'POST',
          headers: {
            'Accept': 'application/json',
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            "restaurant_id": id,
            "name": name,
            "rating": rating,
            "comments": comments
          })
        }).then(res => res.json())
        .then(response => DBHelper.submitReview_indexedDB(response.id))
        .then(response => {
          document.getElementById("review-name").value = "";
          document.getElementById("review-rating").value = "";
          document.getElementById("review-comment").value = "";
          document.getElementById("review-message").innerHTML = "<div class='success-message'>Review submitted.</div>";
        })
        .catch(error => console.error('Error:', error));
    }
  };

  static submitReview_indexedDB(review_id) {
    fetch('http://localhost:1337/reviews/' + review_id)
      .then(response => {
        return response.json()
      })
      .then(review => {
        DBHelper.checkDB('reviews').then(function (data) {
          dbPromise.then(function (db) {
            var tx = db.transaction('reviews', 'readwrite');
            var reviews = tx.objectStore('reviews');
            reviews.put(review);
            return tx.complete;
          });
        });
      })
  };
  static deferReview(id, name, rating, comments) {
    DBHelper.checkDB('storedReviews').then(function (data) {
      dbPromise.then(function (db) {
        if (!db) return db;

        var reviewData = {
          restaurant_id: id,
          name: name,
          rating: rating,
          comments: comments,
        }

        var tx = db.transaction('storedReviews', 'readwrite');
        var storedReviews = tx.objectStore('storedReviews');

        storedReviews.add(reviewData);
      });
    });
  };
  static sendStoredReviews() {
    DBHelper.checkDB('storedReviews').then(function (data) {
      dbPromise.then(function (db) {
        var tx = db.transaction('storedReviews', 'readwrite');
        var storedReviews = tx.objectStore('storedReviews');
        return storedReviews.getAll();
      }).then(data => {
        if (data.length > 0) {
          data.forEach(review => {
            var restaurant_id = review.restaurant_id,
              name = review.name,
              rating = review.rating,
              comments = review.comments,
              review_key = review.id;
            fetch(DBHelper.REVEIW_URL + '/', {
                method: 'POST',
                headers: {
                  'Accept': 'application/json',
                  'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                  "restaurant_id": restaurant_id,
                  "name": name,
                  "rating": rating,
                  "comments": comments
                })
              }).then(res => res.json())
              .then(response => DBHelper.submitReview_indexedDB(response.id))
              .then(result => DBHelper.deleteStoredReview(review_key))
              .catch(error => console.error('Error:', error));
          });
        }
      });
    });
  };

  static deleteStoredReview(review) {
    DBHelper.checkDB('storedReviews').then(function (data) {
      dbPromise.then(function (db) {
        if (!db) return db;

        var tx = db.transaction('storedReviews', 'readwrite');
        var storedReviews = tx.objectStore('storedReviews');

        storedReviews.delete(review);
        return tx.complete;
      }).catch(error => {
        if (error.message.includes("not found")) {
          DBHelper.sendStoredReviews()
        }
      });
    });
  }
  /**
   * Map marker for a restaurant.
   */
  static mapMarkerForRestaurant(restaurant, map) {
    const marker = new google.maps.Marker({
      position: restaurant.latlng,
      title: restaurant.name,
      url: DBHelper.urlForRestaurant(restaurant),
      map: map,
      animation: google.maps.Animation.DROP
    });
    return marker;
  }

}

function checkConnectivity() {
  if (navigator.onLine) {
    DBHelper.sendStoredReviews()
    return true;
  } else {
    return false;
  }
}

window.addEventListener('online', checkConnectivity);
window.addEventListener('offline', checkConnectivity);