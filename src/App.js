

import React, { useState, useEffect, useMemo } from "react";
import { from, BehaviorSubject, of } from "rxjs";
import { filter, debounceTime, mergeMap, distinctUntilChanged, tap, catchError } from "rxjs/operators";
import "./styles.css";
import loader from "./assets/loader.gif";
import refresh from "./assets/refresh.png";
import generic_flag from "./assets/flag_generic.png";

/*  TODOS: 
  [1] use fromFetch instead of fetch
  [2] fix display search results not found
  [3] validate flag and use generic flag (andorra)
  [4] display the flag in a new screen click on country and store in an internal IndexDB
  [5] sort the data by display from IndexDB first
  [6] store the data items as an immutable.js object
  [7] use SASS/SCSS 
  [8] use Unit tests
  [9] 
*/

const API = `https://restcountries.com/`;
const VERSION = 'v3.1/';
// https://restcountries.com/v2/name/

const useObservable = (observable, setter) => {
  useEffect(() => {
    let subscription = observable.subscribe(data => {
      setter({ data });
      console.log('data>>>>', data);
    });

    return () => subscription.unsubscribe();
  }, [observable, setter]);
};
let fetchSubject = new BehaviorSubject("");
let fetchResultsObservable = fetchSubject.pipe(
  filter(url => !isEmpty(url)),
  mergeMap(url => from(init(url))),
  catchError(() => of(<div className="err">ERROR</div>))
);

const init = async (baseURL) => {
  try {
    const results = await fetch(baseURL + VERSION + `all`)
      .then((res) => res.json())
      .then(res => filterData(res));
    return results;
  } catch (err) { console.log(err); };
}

let searchSubject = new BehaviorSubject("");
let searchResultsObservable = searchSubject.pipe(
  filter((value) => value.length > 1),
  debounceTime(750),
  distinctUntilChanged(),
  mergeMap(value => from(serchByName(value))),
  tap((ev) => console.log("ev " + JSON.stringify(ev))),
  catchError(() => of(<div className="err">ERROR</div>)),
);

const serchByName = async (name) => {
  try {
    const results = await fetch(API + VERSION + `name/${name.toLowerCase()}`)
      .then(res => res.json())
      .then(res => filterData(res));
    if (!isEmpty(results))
      return results;
    else return [];
  } catch (err) {
    console.log(`Country with ${name} name not found!`);
  };
};

const App = () => {
  const [search, setSearch] = useState("");
  const [result, setResult] = useState([]);
  const [nations, setNations] = useState([]);

  useObservable(fetchResultsObservable, setNations);
  useObservable(searchResultsObservable, setResult);

  const handleSearchChange = async (e) => {
    const newValue = await e.target.value;
    setSearch(newValue);
  };

  // useMemo for fetching data on mount
  useMemo(() => {
    fetchSubject.next(API);
  }, []);

  // useMemo for search results
  useMemo(() => {
    searchSubject.next(search);
    console.log("search : ", search);
    console.log("result : ", result);
  }, [search, result]);

  const renderNations = (items) => {
    if (!isEmpty(items)) {
      console.log('items :>> ', items);
      return items.data.map(item =>
        <div key={item.id}>
          <button
            style={{ backgroundColor: 'transparent', border: 'transparent' }}
            onClick={() => console.log('item.id :>> ', item.name)}
          >
            <img src={item.flag} style={{ width: 26 }} alt="flag" />
            {`    ${item.name}    `}
          </button>
          <button
            style={{ backgroundColor: 'transparent', border: 'transparent' }}
            onClick={() => renderNations(items)}>
            <img src={refresh} style={{ width: 14 }} alt="refresh" />
          </button>
        </div >
      );
    } else return [];
  };

  return (
    <div className="App">
      <h1>REST COUNTRIES</h1>
      <input
        type="text"
        placeholder="Search a country by name"
        value={search}
        onChange={handleSearchChange}
      />
      <div className="container">
        <div className="list-item">
          <>
            {isEmpty(search) && !isEmpty(nations)
              && renderNations(nations)
            }
            {search.length > 1 && !isEmpty(result)
              && renderNations(result)
            }
            {isEmpty(result) && isEmpty(nations) &&
              <div>
                Loading...
                <img src={loader} style={{ width: 26 }} alt="loading" />
              </div>
            }
          </>
        </div>
      </div>
    </div >
  );
};

const filterData = async (res) => {
  // console.log('res :>> ', res);
  try {
    let results = [];
    !isEmpty(res) &&
      await res.map(nation =>
        results.push({
          id: Math.random().toString(36).slice(-5),
          name: nation.name.common,
          flag: !isEmpty(nation.flags) && !isEmpty(nation.flags.svg) //&& isValidURL(nation.flags.svg)
            ?
            nation.flags.svg
            :
            !isEmpty(nation.flag) && isValidURL(nation.flag)
              ?
              nation.flag
              :
              generic_flag
        })
      );
    return results;
  } catch (err) {
    console.log(`err`, err)
    return false;
  }
};

const isValidURL = async (url) => {
  try {
    const result = await fetch(url, { method: 'HEAD' });
    if (result.ok === true)
      return true;
    else return false;
  } catch (err) {
    console.log(`url not valid: ${url}`)
    return false;
  }
};

const isEmpty = (val) => {
  return (val === undefined || val == null || val.length <= 1) ? true : false;
}

export default App;
