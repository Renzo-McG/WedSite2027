# Travel & Stay: evidence register

The research behind every fact on `/travel/`. Guest-facing copy lives in
`src/data/travel.ts`; this file records where each figure came from, when it was checked, and
how far it can be trusted. **Change a figure in the data file and update its row here in the
same commit.**

All checks: **18 September 2026**, from the UK, prices in GBP. Browser research used Google
Flights, Google Hotels and Google Maps with non-essential cookies rejected.

Confidence: **High** means an official source (airline, hotel, government), consistent with a
second source. **Medium** means a respected aggregator or a single official source. **Low**
means inferred or a third-party source only.

## The big limitation

**October 2027 flights and rooms are not on sale yet.** Airlines generally open bookings
around 330 to 362 days ahead, so wedding-date inventory should appear from roughly
November 2026. Every price on the page is therefore a planning figure taken from **October
2026** (the same season one year earlier), labelled "checked September 2026". Refresh it
once real October 2027 fares and rates are bookable.

## Flights, London to Cebu

| Fact on page                                                            | Source                                                                                                                                                   | Confidence / limitation                                                                                                                      |
| ----------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------- |
| No direct UK–Cebu flights; fastest one-stop is 16 h 10 m                | Google Flights route page, London → Cebu City ("Non-stop flights: None"; "Fastest flight 16 hrs 10 min")                                                 | High                                                                                                                                         |
| Cathay Pacific via Hong Kong, about 16½ hours, arrives Terminal 2       | cathaypacific.com London–Cebu page ("around 16 hours and 30 minutes, including the layover, and bring you to Terminal 2")                                | High                                                                                                                                         |
| Cathay from around **£910** return                                      | Same page: lowest fares seen in last 48 h, round trip economy, Sep–Oct 2026 departures ranged **£909–£1,154**; Oct 2026 from £909                        | Medium. "From" fares only; wedding-week fares near 24 Oct 2026 were £1,009–£1,154                                                            |
| Hong Kong → Cebu is 2 h 45 m, daily                                     | cathaypacific.com HKG–CEB page ("daily direct flights", "2 hours 45 minutes"); FlightConnections shows 8/week CX (19/week incl. Cebu Pacific, June 2026) | High                                                                                                                                         |
| London → Hong Kong 13 h 05 m                                            | FlightConnections LHR–HKG ("fastest direct flight … 13 hours and 5 minutes")                                                                             | Medium. Longer than pre-2022 timings because of airspace routing                                                                             |
| Singapore Airlines via Singapore, 17–19 hours, from Heathrow or Gatwick | singaporeair.com London–Cebu page FAQ ("typically ranges from around 17h to 19h"; departs LHR and LGW)                                                   | High                                                                                                                                         |
| Singapore from around **£980** return                                   | Same page: "Oct from GBP 982" (economy, 7-day return, fares collected periodically); overall "from GBP 778" in Feb 2027                                  | Medium                                                                                                                                       |
| London → Singapore 13 h 45 m; Singapore → Cebu 3 h 40 m, daily          | FlightConnections LHR–SIN and SIN–CEB (SIN–CEB "7 times a week")                                                                                         | Medium                                                                                                                                       |
| Emirates via Dubai, about 19 hours                                      | emirates.com LHR–CEB schedule: 14:20/14:25 departures, 18 h 55 m–19 h 00 m, 1 stop; a 09:05 option takes 24 h 15 m                                       | High                                                                                                                                         |
| Dubai → Cebu four times a week, 9 h 25 m                                | FlightConnections DXB–CEB ("4 times a week", "9 hours and 25 minutes")                                                                                   | Medium. Emirates' own Philippines menu lists Clark and Manila, not Cebu, though its Cebu route pages are live. Check before the next refresh |
| Emirates from around **£860** return                                    | Google Flights "Popular airlines": Emirates from £856 (29 Oct–11 Nov 2026)                                                                               | Medium. Single observation                                                                                                                   |
| London → Dubai 7 h                                                      | FlightConnections LHR–DXB                                                                                                                                | Medium                                                                                                                                       |
| Planning band **£850–£1,250** return, economy                           | Derived from the rows above plus Google Flights "typical prices": November (cheapest) £680–820, July (most expensive) £960–1,250                         | Medium. A planning band, not a quote. Late October sits between those months                                                                 |
| Qatar Airways via Doha **not recommended**                              | FlightConnections DOH–CEB shows QR schedules only to March 2026; unclear whether the route runs in October                                               | Excluded for uncertainty                                                                                                                     |
| Philippine Airlines via Manila **not recommended**                      | PAL route pages market London–Manila but show connecting itineraries; Cebu would need a further domestic flight                                          | Excluded: an extra connection for guests                                                                                                     |

**Why Cathay is "our suggested route":** it is the quickest (≈16½ h), its October 2026 fares
were below Singapore's, and the final Hong Kong–Cebu hop is short and daily. Singapore is
the close alternative (excellent airline, Heathrow _or_ Gatwick, easy Changi transfer).
Emirates is often cheapest but runs only four days a week. **This ranking is a
recommendation for Emily and Lawrence to confirm.** Change `featured` in the data file to
swap it.

## Arrival

| Fact on page                                                                     | Source                                                                                                          | Confidence / limitation                                                                                         |
| -------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------- |
| Shangri-La is "no more than a 20 minute-drive" from the airport; 8 km            | shangri-la.com Mactan "Map & Directions"                                                                        | High                                                                                                            |
| 9 km by road (page rounds 9.1)                                                   | Google Maps directions, airport → Shangri-La: 9.1 km, 16 min (measured about 04:50 Cebu time, so light traffic) | High for distance; time is best case                                                                            |
| International flights arrive at Terminal 2                                       | cathaypacific.com ("bring you to Terminal 2 in Cebu")                                                           | Medium. Stated for Cathay; general for international carriers                                                   |
| Grab pick-up at Terminal 2 North/South Wing drop-off; price shown before booking | grab.com MCIA airport page                                                                                      | High                                                                                                            |
| Metered airport taxis queue outside arrivals                                     | Airport guides (pana.ph, 3d-universal.com)                                                                      | Low–Medium. The Shangri-La page also lists taxis; its "PHP 120–150" fare looks out of date and is **not** shown |
| Hotel car from PHP 1,600 for up to four, flight details a day ahead              | shangri-la.com Map & Directions (Altis sedan PHP 1,600)                                                         | High                                                                                                            |
| £1 ≈ PHP 84                                                                      | Mid-market rate, 11–18 September 2026 (Pluang, exchangerates.org.uk)                                            | Medium. Used only for the "about £19" conversion and the Money note                                             |

## Accommodation

Prices: **Google Hotels, two adults, lowest rate listed per night**, sampled twice: once for
**23–26 October 2026** and once for another late-October stay. The page shows "from around",
rounded, because these are entry-level rooms. Suites, villas and peak nights cost more.

| Hotel                              | Price samples    | Shown            | Drive to Shangri-La                                                                           | From airport    | Official site                    |
| ---------------------------------- | ---------------- | ---------------- | --------------------------------------------------------------------------------------------- | --------------- | -------------------------------- |
| Shangri-La Mactan                  | £170, £161       | from around £160 | (venue)                                                                                       | 9.1 km, 16 min  | shangri-la.com/cebu/mactanresort |
| Mövenpick Hotel Mactan Island Cebu | £99, £86         | from around £85  | 600 m by road (Maps reported 9 min, an artefact of one-way resort roads, so no time is shown) | 8.8 km, 14 min  | movenpick.accor.com              |
| Sheraton Cebu Mactan Resort        | £148, £166       | from around £150 | 2.9 km, 9 min                                                                                 | 10.8 km, 19 min | marriott.com (cebsi)             |
| Dusit Thani Mactan Cebu            | £113, £78, £86   | from around £80  | 4.0 km, 11 min                                                                                | 11.9 km, 21 min | dusit.com                        |
| Crimson Resort & Spa Mactan        | £177, £105, £112 | from around £105 | 4.3 km, 12 min                                                                                | 10.2 km, 19 min | crimsonhotel.com/mactan          |
| Fairfield by Marriott Cebu Mactan  | £61              | from around £60  | 6.5 km, 11 min                                                                                | 2.6 km, 5 min   | marriott.com (cebfi)             |

All drive times: Google Maps, measured 18 Sep 2026 around 04:45–05:00 Cebu time, i.e. light
traffic. The page says so and tells guests to allow longer at busy times.

Coordinates for the plot (Google Maps place/directions data):

| Place                             | Lat       | Lng        |
| --------------------------------- | --------- | ---------- |
| Mactan-Cebu International Airport | 10.313617 | 123.983356 |
| Shangri-La Mactan                 | 10.308194 | 124.019728 |
| Mövenpick                         | 10.310525 | 124.023404 |
| Sheraton                          | 10.320973 | 124.036050 |
| Dusit Thani                       | 10.330393 | 124.039316 |
| Crimson                           | 10.296647 | 124.014051 |
| Fairfield                         | 10.326802 | 123.978648 |
| Cebu City (Fuente Osmeña)         | 10.310203 | 123.893677 |

Descriptive facts:

| Fact                                                                                                  | Source                                                        | Confidence                                                                                  |
| ----------------------------------------------------------------------------------------------------- | ------------------------------------------------------------- | ------------------------------------------------------------------------------------------- |
| Shangri-La: gardens, own beach, Marine Sanctuary, Chi, The Spa                                        | shangri-la.com About page                                     | High                                                                                        |
| Mövenpick: 245 rooms, Mediterranean-inspired beachfront                                               | movenpick.accor.com (via search summary)                      | Medium. Its Ibiza Beach Club was being rebuilt in 2026, so it is deliberately not mentioned |
| Sheraton: 261 rooms, large rooms, beachfront pool, Kids' and Teens' Clubs                             | Philippine Primer, May 2026                                   | Medium. marriott.com blocks automated access (HTTP 403), so it was not read directly        |
| Dusit Thani: Punta Engaño, 100 m infinity pool, spa, 500 m² kids' Fun Zone                            | dusit.com                                                     | High                                                                                        |
| Crimson: 6 ha, Balinese-inspired, three-tiered infinity pool, private beach, villas with plunge pools | crimsonhotel.com (via search summary) + Filinvest Hospitality | Medium                                                                                      |
| Fairfield: opened 19 Dec 2025, 196 rooms, city hotel near the airport                                 | Cebu Daily News / Inquirer, Philstar                          | Medium                                                                                      |

Considered and not shortlisted: **Abaca Resort** (closed since 2020 for redevelopment;
reopening status could not be confirmed), **Plantation Bay** (lovely, but 20 min and 9.9 km
away, a weaker fit than Crimson for a longer resort stay), **Savoy Hotel Mactan Newtown**
(cheap and 2.3 km away, but a 3.7/5 guest rating against Fairfield's 4.6).

## Trip ideas and practical notes

| Fact                                                                                  | Source                                                                             | Confidence                                          |
| ------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------- | --------------------------------------------------- |
| Island hopping to Hilutungan and Nalusuan sanctuaries by banca from Mactan            | Several Mactan tour operators (Klook, GetYourGuide, local operators)               | Medium                                              |
| Cebu City → Tagbilaran (Bohol) fast ferry about 2 hours                               | OceanJet schedule summaries (pamasahe.com, waug.com)                               | Medium                                              |
| Moalboal 2½–3 hours' drive; sardine run; Kawasan Falls nearby                         | Tour operator itineraries                                                          | Medium                                              |
| Direct Cebu → El Nido flights about 1 h 50 m (AirSWIFT, now operated by Cebgo)        | Cebu Pacific/JG Summit news; Airpaz schedule                                       | Medium. Check the operator before quoting to guests |
| British citizens: 30 days visa-free; 6 months' passport validity; onward-travel proof | GOV.UK Philippines entry requirements                                              | High                                                |
| eTravel QR code within 72 h before arrival; free                                      | GOV.UK; etravel.gov.ph ("eTravel is FREE")                                         | High                                                |
| Cebu 7 h ahead of UK on 24 Oct 2027; 8 h after UK clocks change on 31 Oct 2027        | Cebu is UTC+8 with no DST; UK BST ends on the last Sunday of October (31 Oct 2027) | High                                                |
| 25–30 °C; late October is the tail of the rainy season                                | FlightConnections climate note; Google Flights ("rainy season Jun–Nov")            | Medium                                              |
| UK plugs need an adapter                                                              | Philippines uses Type A/B/C sockets                                                | High                                                |

## Imagery

The hero is **frame 461 (the last frame) of `public/assets/stage/video/venue-ocean-pavilion.mp4`**,
the committed Ocean Pavilion film cut from Shangri-La Mactan's own Event Spaces film. It is
the frame the invitation's film comes to rest on. It is exported without extra grading, as
1920 w (183 KB) and 1080 w (96 KB) WebP. No hotel imagery is used: official photos of the
other five properties are not licensed for reuse, and the page reads better without a
catalogue of thumbnails.

To regenerate:

```sh
for w in 1920 1080; do
  ffmpeg -i public/assets/stage/video/venue-ocean-pavilion.mp4 \
    -vf "select=eq(n\,461),scale=$w:-2:flags=lanczos" -frames:v 1 \
    -c:v libwebp -quality 80 -compression_level 6 \
    public/assets/travel/ocean-pavilion-rest-$w.webp
done
```

## Round 2 additions (19 September 2026)

| Fact on page                                                                                             | Source                                                                       | Confidence / limitation                                                                                       |
| -------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------- |
| Fairfield: "One of Mactan's newest hotels … on the Mactan Channel", in Mahi Center, MEPZ 1, Barangay Ibo | Cebu Daily News, Philstar, AppleOne Group                                    | Medium. Sources disagree on the opening date (19 Dec 2025 vs 15 Apr 2026), so the page no longer gives a date |
| Mactan's coastline, runway and islands on the maps                                                       | OpenStreetMap, fetched 18 Sep 2026 (see the asset register)                  | High for shape at this scale. A test confirms every hotel and the airport sit inside Mactan's coastline       |
| Cebu is 7 hours ahead on the wedding weekend and 8 after 31 Oct 2027                                     | Computed live from the `Europe/London` and `Asia/Manila` time zones (tested) | High                                                                                                          |
| Trip idea photos (Nalusuan, Bohol, Moalboal, El Nido), airport photo                                     | Wikimedia Commons, CC BY / CC BY-SA, credited on screen                      | High (licences recorded in the asset register)                                                                |

## Round 3 additions (19 September 2026)

| Fact on page                                                                                                                                                                  | Source                                                                                                                                                                                                                   | Confidence / limitation                                                                                                                   |
| ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ----------------------------------------------------------------------------------------------------------------------------------------- |
| Cathay London → Hong Kong 12 h 50 m (the journey's first leg, was 13 h 05 m)                                                                                                  | Heathrow timetable for CX250 (18:20 BST → 14:10 HKT next day), via flight-schedule summaries                                                                                                                             | Medium. Keeps the drawn journey at Cathay's own "around 16 hours and 30 minutes, including the layover"                                   |
| Changing planes: about 1 h (Hong Kong), about 1½ h (Singapore), about 2½ h (Dubai)                                                                                            | Derived: each airline's published door-to-door time less the scheduled flying time. Emirates: 18 h 55 m–19 h 00 m less 16 h 25 m. Cathay: 16 h 30 m less 15 h 35 m. Singapore Airlines: its 17–19 h range less 17 h 25 m | Medium. These are the quickest usual connections; the page says many itineraries wait longer. Recheck against real October 2027 schedules |
| The wedding window: be in Cebu by Saturday 23 October; no onward travel before Monday 25 October                                                                              | Emily and Lawrence's Round 3 brief                                                                                                                                                                                       | High (their instruction)                                                                                                                  |
| Siargao about 1 h by air from Cebu (Cebu Pacific, Philippine Airlines)                                                                                                        | PAL and Cebu Pacific route pages; flight-search summaries ("about 50 minutes", "shortest 55 min")                                                                                                                        | Medium                                                                                                                                    |
| Coron (Busuanga) about 1 h 20 m by air from Cebu (Cebgo, PAL, Sunlight Air)                                                                                                   | FlightConnections CEB–USU ("1 hour and 20 minutes", 29 flights a week, July 2026)                                                                                                                                        | Medium                                                                                                                                    |
| Kawasan Falls 30–45 minutes south of Moalboal; canyoneering on the Kanlaob River                                                                                              | Travel guides (WhyCebu, Best of Moalboal, JourneyEra)                                                                                                                                                                    | Medium                                                                                                                                    |
| Cebu City 30–60 minutes from Mactan by road, traffic allowing                                                                                                                 | Google Maps typical drive times across the Mactan bridges                                                                                                                                                                | Medium. Traffic varies widely                                                                                                             |
| Siargao: Cloud 9, Daku, Guyam and Naked Island; Coron: Kayangan Lake, hot springs, wreck diving; Cebu City: Magellan's Cross, Basilica del Santo Niño, Fort San Pedro, lechon | Standard destination guides; Wikimedia Commons subjects                                                                                                                                                                  | High for the attractions; no prices or schedules are given                                                                                |
| Direct flights from Mactan-Cebu to Siargao, El Nido and Coron, so no need to go back through Manila                                                                           | The route rows above                                                                                                                                                                                                     | Medium                                                                                                                                    |
