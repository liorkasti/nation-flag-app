import React, { useState, useEffect, useMemo } from "react";
import { from, BehaviorSubject, timer, of, zip } from "rxjs";
import {
  filter, debounceTime, mergeMap, distinctUntilChanged,
  tap, map, catchError, startWith, switchMap, takeUntil
} from "rxjs/operators";
import { fromFetch } from "rxjs/fetch";
import { $ } from "react-rxjs-elements";
import "./styles.css";
import loader from "./assets/loader.gif";
import refresh from "./assets/refresh.png";
import generic_flag from "./assets/flag_generic.png";

/*  TODOS: 
  [1] use fromFetch instead of fetch
  [2] fix display search results
  [3] filter results to emitte only name and flag  
  [4] validate flag and use generic flag (andorra)
  [5] display the country flag in a new screen and store the object by using Memoize and an internal IndexDB
  [6] sort the data by display from IndexDB first
  [7] store the data items as an immutable.js object
  [8] use SASS/SCSS 
  [9] use Unit tests
*/

const API = `https://restcountries.com/`;
const VERSION = 'v3.1/';
// https://restcountries.com/v2/name/

const App = () => {
  const [search, setSearch] = useState("");
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState([]);
  const [nations, setNations] = useState([]);
  const { Map } = require('immutable');

  const init = async (baseURL) => {
    try {
      await fetch(baseURL + VERSION + `all`).then((res) => res.json())
        .then(res => filterData(res));
    } catch (err) {
      console.log(err);
    };
  }

  const filterData = async (res) => {
    try {
      !isEmpty(res) &&
        await res.map(nation =>
          nations.push({
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
      setLoading(true)
    } catch (err) {
      console.log(`err`, err)
      return false;
    }
  };

  let fetchSubject = new BehaviorSubject([]);
  let fetchResultsObservable = fetchSubject.pipe(
    filter(url => !isEmpty(url)),
    mergeMap(url => from(init(url))),
    catchError(() => of(<div className="err">ERROR</div>)),
  );

  let searchSubject = new BehaviorSubject("");
  let searchResultsObservable = searchSubject.pipe(
    filter(url => !isEmpty(url)),
    debounceTime(500),
    distinctUntilChanged(),
    mergeMap(value => from(getCountry(value)))
  );

  const getCountry = async (name) => {
    const allNations = await fetch(API + VERSION + `name/${name}`).then((res) => res.json());
    console.log("allNations : ", allNations);
    const results = allNations.filter((nation) =>
      nation.name.common.toLowerCase().includes(name.toLowerCase())
    );
    console.log("results>>> : ", results);
    return results;
  };

  const useObservable = (observable, setter) => {
    useEffect(() => {
      let subscription = observable.subscribe(result => {
        setter({ result });
      });

      return () => subscription.unsubscribe();
    }, [observable, setter]);
  };
  useObservable(searchResultsObservable, setResults);

  useObservable(fetchResultsObservable, setData);

  const handleSearchChange = (e) => {
    const newValue = e.target.value;
    setSearch(newValue);
  };

  // useMemo for fetching data on mount
  useMemo(() => {
    fetchSubject.next(API);
  }, []);

  // useMemo for search results
  useMemo(() => {
    searchSubject.next(search);
  }, [search]);

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
            {search.length <= 1 && loading ?
              nations.map(nation =>
                <div key={nation.id}>
                  <img key={nation.id} src={nation.flag} style={{ width: 26 }} alt="flag" />
                  {`    ${nation.name}    `}
                  <img src={refresh} style={{ width: 14 }} alt="Refresh image" />
                </div>
              )
              :
              search.length > 1 && results.length > 0 ?
                results.map(nation =>
                  <div key={nation.id}>
                    <img key={nation.id} src={nation.flag} style={{ width: 26 }} alt="flag" />
                    {`    ${nation.name}    `}
                    <img src={refresh} style={{ width: 14 }} alt="Refresh image" />
                  </div>
                )
                :
                <div>
                  Loading...
                  <img src={loader} style={{ width: 26 }} alt="Responsive image" />
                </div>
            }
          </>
        </div>
      </div>
    </div >
  );
};


const isValidURL = async (url) => {
  try {
    const result = await fetch(url, { method: 'HEAD' });
    if (result.ok == true)
      return true;
    else return false;
  } catch (err) {
    console.log(`url not valid: ${url}`)
    return false;
  }
};

const isEmpty = (val) => {
  return (val == undefined || val == null || val.length < 1) ? true : false;
}

export default App;
