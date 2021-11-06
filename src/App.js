import React, { useState, useEffect, useMemo } from "react";
import "./styles.css";
import loader from "./assets/loader.gif";

const api = `https://restcountries.com/v3.1/all`;

const App = () => {
  const [search, setSearch] = useState("");
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);

  // useEffect for fetching data on mount
  useEffect(() => {
    fetch(api)
      .then((response) => response.json())
      .then((data) => setData(data), console.log("data: ", data));
    setLoading(true);
  }, []);

  const handleSearchChange = (e) => {
    const newValue = e.target.value;
    setSearch(newValue);
    console.log("search : ", search);
  };

  return (
    <div className="App">
      <h1>Italia</h1>
      <input
        type="text"
        placeholder="Search a country by name"
        value={search}
        onChange={handleSearchChange}
      />
      {loading ? (
        data.map((nation) => (
          <div key={nation.name.common}>{nation.name.common}</div>
        ))
      ) : (
        <div>
          Loading...
          <img src={loader} className="img-fluid" alt="Responsive image" />
        </div>
      )}
    </div>
  );
};

export default App;
