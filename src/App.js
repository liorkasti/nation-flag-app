import React, { useState, useEffect, useMemo } from "react";
import { from, BehaviorSubject, timer, of, zip } from "rxjs";
import {
  filter, debounceTime, mergeMap, distinctUntilChanged,
  tap, map, catchError, startWith, switchMap
} from "rxjs/operators";
import { fromFetch } from "rxjs/fetch";
import { $ } from "react-rxjs-elements";
import "./styles.css";
import loader from "./assets/loader.gif";
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

const api = `https://restcountries.com/v3.1/all`;

let searchSubject = new BehaviorSubject("");
let searchResultsObservable = searchSubject.pipe(
  // console.log("searchSubject :>> ", searchSubject),
  filter(value => value.length > 1),
  debounceTime(500),
  distinctUntilChanged(),
  mergeMap(value => from(getCountry(value))),
  tap(ev => console.log("value" + JSON.stringify(ev)))
);

const getCountry = async (term) => {
  const allNations = await fetch(api).then((res) => res.json());
  console.log("allNations : ", allNations);
  const results = allNations.filter((nation) =>
    nation.name.common.toLowerCase().includes(term.toLowerCase())
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

const App = () => {
  const [search, setSearch] = useState("");
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState([]);

  const customFetch = (url) => {
    // wait for both fetch and a 500ms timer to finish
    return zip(
      fromFetch(url).pipe(switchMap(r => r.json())),
      timer(500) // set a timer for 500ms
    ).pipe(
      // then take only the first value (fetch result)
      map(([data]) => data),
      tap(ev => console.log("value>>>>>" + JSON.stringify(ev)))
    )
  }

  const stream$ = useMemo(() => // TODO: Fix this
    customFetch(api).pipe(
      map(data =>
        <div>{data.message}</div>,
        map(data => <div>{data}</div>),
        catchError(() => of(<div className="err">ERROR</div>)),
        startWith(<div className="loading">loading...</div>),
        tap(ev => console.log("data>>" + JSON.stringify(ev)))
      ))
    , []);

  // useMemo for fetching data on mount
  useMemo(() => {
    fetch(api)
      .then(response => response.json())
      .then(data => setData(data));
    setLoading(true);
  }, []);

  useObservable(searchResultsObservable, setResults);

  const handleSearchChange = (e) => {
    const newValue = e.target.value;
    setSearch(newValue);
    searchSubject.next(newValue);
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
          <$>{stream$}</$>
          <>
            {search.length <= 1 && loading ?
              data.map(nation =>
                <div key={nation.name.common}>
                  <img src={nation.flags.svg ? nation.flags.svg : generic_flag} style={{ width: 26 }} alt="flag" />
                  {`  ${nation.name.common}`}
                </div>
              )
              :
              search.length > 1 && results.length > 0 ?
                results.map(nation =>
                  <div key={nation.name.common}>
                    <img src={nation.flags.svg ? nation.flags.svg : generic_flag} style={{ width: 26 }} alt="flag" />
                    {`  ${nation.name.common}`}
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

export default App;
