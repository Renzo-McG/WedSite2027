# Guest companion: asset register

Every photograph and map source used by the guest companion (`/`, or legacy `/welcome/`,
`/travel/`, `/stay/`, `/trip/`, `/wedding/`). The image metadata the site renders lives in
`src/data/travel.ts` and `src/data/site.ts`; this file is the human record and the
**deployment gate**.

Source masters are kept outside the repository in `~/Downloads/WS/guide-masters/`. Delivered
files are WebP in `public/assets/guide/`, named `{name}-{width}.webp`.

## Deployment gate

> **Do not deploy while any row below says "Permission to confirm".** These images come from
> the hotels' own websites or Marriott's own image service. They are official promotional
> images, but we have not asked for permission to use them. Before going live, either get
> permission (a short email to each hotel's marketing team is usually enough), use their
> press-kit images under their terms, or swap them for licensed alternatives.

## Venue film (in use on the live site already)

Frames from `public/assets/stage/video/venue-ocean-pavilion.mp4`, which is cut from
Shangri-La Mactan's own Event Spaces film (see `docs/OCEAN_PAVILION_VIDEO.md`).

| Name                | Frame | Used on                                | Status     |
| ------------------- | ----- | -------------------------------------- | ---------- |
| `venue-aerial`      | 0     | Home hero (the arrival)                | Venue film |
| `pavilion-exterior` | 120   | The wedding hero, Home wedding door    | Venue film |
| `pavilion-interior` | 170   | The wedding (the venue)                | Venue film |
| `stay-shangri-la`   | 420   | Stay (Shangri-La card), Home stay door | Venue film |

## Hotel photographs

| Name             | Hotel                              | Source                                                                                                      | Status                                                           |
| ---------------- | ---------------------------------- | ----------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------- |
| `stay-movenpick` | Mövenpick Hotel Mactan Island Cebu | Accor image service (`m.ahstatic.com`, image `HCM_P_6973051`), the hero on the hotel's official page        | Permission to confirm                                            |
| `stay-dusit`     | Dusit Thani Mactan Cebu            | dusit.com (`DTMC-1920x900_exterior-min.jpg`), the official site's exterior hero                             | Permission to confirm                                            |
| `stay-crimson`   | Crimson Resort & Spa Mactan        | crimsonhotel.com image CMS ("Infinity_Pool", 530 × 530, the largest size published)                         | Permission to confirm                                            |
| `stay-sheraton`  | Sheraton Cebu Mactan Resort        | Marriott's official activities page image (`CEBSI_si-cebsi-resort-facade`)                                  | Permission to confirm                                            |
| `stay-fairfield` | Fairfield by Marriott Cebu Mactan  | Marriott's official activities page image (`CEBFI_fi-cebfi-lobby`). **Appears to be a pre-opening render.** | Permission to confirm; consider replacing with a real photograph |

## Licensed photographs (Wikimedia Commons)

Credited on screen with a link to the licence. CC BY-SA images are used unmodified apart from
resizing and format conversion.

| Name             | Subject                     | Author               | Licence      | Source                                                                                                 |
| ---------------- | --------------------------- | -------------------- | ------------ | ------------------------------------------------------------------------------------------------------ |
| `idea-nalusuan`  | Nalusuan island             | Martin Michlmayr     | CC BY-SA 4.0 | https://commons.wikimedia.org/wiki/File:Nalusuan_dive_trip_June_2025_067.jpg                           |
| `idea-cebucity`  | Magellan's Cross, Cebu City | Elmer B. Domingo     | CC BY-SA 4.0 | https://commons.wikimedia.org/wiki/File:Magellan%27s_Cross_Cebu_City.jpg                               |
| `idea-kawasan`   | Kawasan Falls, Badian       | Shemlongakit         | CC BY-SA 4.0 | https://commons.wikimedia.org/wiki/File:Badian_Kawasan_Falls_Cebu.jpg                                  |
| `idea-siargao`   | Outrigger boats, Siargao    | ChaasPrime           | CC BY-SA 4.0 | https://commons.wikimedia.org/wiki/File:Siargao_14.jpg                                                 |
| `idea-coron`     | Kayangan Lake, Coron        | Lyndon Aguila        | CC BY-SA 4.0 | https://commons.wikimedia.org/wiki/File:Kayangan_Lake,_Coron_Island.jpg                                |
| `idea-bohol`     | Chocolate Hills, Bohol      | Wolfgang Hägele      | CC BY-SA 4.0 | https://commons.wikimedia.org/wiki/File:Chocolate_Hills_Carmen_Bohol_2019.jpg                          |
| `idea-moalboal`  | Sardine run, Moalboal       | Iampjanz             | CC BY-SA 4.0 | https://commons.wikimedia.org/wiki/File:Sardine_run_over_seafloor_in_Moalboal_04.jpg                   |
| `idea-elnido`    | Bacuit Bay, El Nido         | Vyacheslav Argenberg | CC BY 4.0    | https://commons.wikimedia.org/wiki/File:Island_lagoon_in_Bacuit_Bay,_El_Nido,_Palawan,_Philippines.jpg |
| `arrive-airport` | Mactan-Cebu Terminal 2      | Ralff Nestor Nacor   | CC BY-SA 4.0 | https://commons.wikimedia.org/wiki/File:Outside_Mactan-Cebu_International_Airport_Terminal_2.jpg       |

The four Round 3 additions (Cebu City, Kawasan, Siargao, Coron) were fetched on 19 Sep 2026 as
2000-pixel renditions through the Commons API, centre-cropped to 3 : 2 and delivered at 700 and
1200 wide.

## Map data

### Natural Earth (Round 3)

`src/data/land-geo.ts` holds two land maps, both from [Natural Earth](https://www.naturalearthdata.com/)
(public domain), fetched on 19 Sep 2026 from the `nvkelso/natural-earth-vector` repository:

- `philippines`: `ne_10m_land`, clipped to 116.4–128.2 E, 4.9–16.2 N, projected to kilometres
  (equirectangular, reference latitude 10.5°), simplified with Douglas–Peucker at about 320 m,
  dropping islands under about 1.2 km². Used by the Your trip map.
- `londonToCebu`: `ne_50m_land`, clipped to 24 W–142 E, 14 S–66 N, reference latitude 30°,
  simplified at about 22 km, dropping land under about 2,500 km². Used by the Travel journey.

The file is generated data (listed in `.prettierignore`). To regenerate: download the two
GeoJSON files, take each polygon's outer ring, clip it to the box (Sutherland–Hodgman), project
with `project()` from `src/lib/geo.ts`, simplify each closed ring in two halves split at its
farthest point, and write the flat `[x, y, …]` rings to one decimal. The test suite checks that
every holiday place reached by road, ferry or air sits on land in the Philippines map (three
pins sit slightly inland of their towns, where the simplified coast would otherwise put them
in the sea: Tagbilaran, El Nido and Coron).

### OpenStreetMap (Mactan)

`src/data/mactan-geo.ts`: OpenStreetMap `natural=coastline` and `aeroway=runway` ways in the
box 10.255–10.36 N, 123.925–124.075 E, fetched on 18 Sep 2026 through the Overpass API. The
segments were joined into rings and simplified to about 20 m. © OpenStreetMap contributors,
ODbL; the credit appears on every map. There are no runtime map requests, tiles or keys.

To regenerate: run the same Overpass query, join the coastline ways by shared node ids into
rings, close the Cebu mainland along the western edge of the box, simplify (Douglas–Peucker,
about 20 m), and write the `[lat, lng]` rings in the same shape. The test suite checks that
every hotel and the airport still fall inside Mactan's ring.
