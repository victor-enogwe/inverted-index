'use strict';

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

/**
* remove array duplicates.
* @param arr - The array to be filtered.
*/
var unique = function unique(arr) {
  var checked = {};
  return arr.filter(function (x) {
    if (checked[x]) {
      return;
    }
    checked[x] = true;
    return x;
  });
};

/**
* JSON file reader.
* @param url - The url of JSON file.
* @param callback - the callback function.
*/
var getJSON = function getJSON(url, callback) {
  return new Promise(function (resolve, reject) {
    var xhr = new XMLHttpRequest();
    xhr.open("GET", url, true);
    xhr.send();
    xhr.onreadystatechange = function () {
      if (this.readyState == 4 && this.status == 200) {
        resolve(callback(this));
      }
    };
    xhr.onerror = reject;
  });
};

/**
* test if json file is valid.
* @param str - The JSON string.
*/
var isJSON = function isJSON(str) {
  var json = JSON.parse(str);
  if (isValidObject(json)) {
    return json;
  } else {
    throw 'json file is not formatted properly';
  }
};

/** check if object follows allowed structure */
var isValidObject = function isValidObject(collection) {
  var i = 0;
  while (i < collection.length) {
    var hasValidTitle = collection[i].title !== undefined && collection[i].title.length > 0 && typeof collection[i].title == 'string';
    var hasValidText = collection[i].text !== undefined && collection[i].text.length > 0 && typeof collection[i].text == 'string';
    if (!(hasValidText && hasValidTitle)) {
      return false;
    }
    i++;
  }
  return true;
};

/** save file and sort docs in json */
var saveTokens = function saveTokens(xhr) {
  var docs = isJSON(xhr.responseText);
  var tokens = {};
  var words = [];
  docs.forEach(function (document, index) {
    var token = '';
    token += document.title + ' ' + document.text;
    var uniqueTokens = unique(token.toLowerCase().match(/\w+/g).sort());
    tokens[index] = uniqueTokens;
    words = words.concat(uniqueTokens);
  });
  return [tokens, docs, words];
};

/** format file name */
var formatFileName = function formatFileName(name) {
  var matcher = new RegExp(/\/\w+.json/, 'gi');
  return matcher.exec(name).toString().slice(1);
};

/** populate reference object */
var populateReference = function populateReference(tokenObj, parent, doc) {
  // @TODO for of and for in babel
  var tokenObjKeys = Object.keys(tokenObj);
  var tokenObjKeysLength = tokenObjKeys.length;
  var index = 0;
  parent.reference[doc] = {};
  while (index < tokenObjKeysLength) {
    tokenObj[index].forEach(function (word) {
      parent.reference[doc][word] !== undefined ? parent.reference[doc][word].push(index) : (parent.reference[doc][word] = [], parent.reference[doc][word].push(index));
    });
    index += 1;
  }
};

// populate our document repository
var populateDocFiles = function populateDocFiles(tokenObj, parent, doc) {
  parent.docFiles[doc] = tokenObj;
};

// filter text input
var inputFIlter = function inputFIlter(value) {
  return value.replace(/[^\w\s]/gi, '').split(' ').filter(function (item) {
    return (/\S/.test(item)
    );
  });
};
/**
 * Class for creating an inverted index.
 * @extends Point
 */

var InvertedIndex = function () {
  /**
  * Create an inverted index.
  * @param reference - The inverted index reference object.
  * @param docFiles - The createIndex instance file names.
  */
  function InvertedIndex() {
    _classCallCheck(this, InvertedIndex);

    this.reference = {}, this.docFileNames = [];
    this.docFiles = {};
    this.currentDocs = [];
    this.words = [];
  }

  _createClass(InvertedIndex, [{
    key: 'createIndex',
    value: function createIndex(file) {
      var _this = this;

      // create index method
      if (this.docFileNames.indexOf(file) == -1) {
        this.docFileNames.push(file);
        getJSON(file, saveTokens).then(function (savedTokens) {
          var docName = formatFileName(file);
          populateDocFiles(savedTokens[1], _this, docName);
          populateReference(savedTokens[0], _this, docName);
          _this.currentDocs.push(docName);
          _this.words = unique(_this.words.concat(savedTokens[2]));
          return _this.reference[docName];
        }).catch(function (err) {
          return err;
        });
      } else {
        return 'document already exists';
      }
    }
  }, {
    key: 'getIndex',
    value: function getIndex(doc) {
      // populate index method
      return this.reference[doc];
    }
  }, {
    key: 'searchIndex',
    value: function searchIndex(value) {
      var _this2 = this;

      //search index method
      inputFIlter(value).forEach(function (word) {
        _this2.currentDocs.forEach(function (doc) {
          console.log(_this2.reference[doc][word]);
        });
      });
    }
  }]);

  return InvertedIndex;
}();