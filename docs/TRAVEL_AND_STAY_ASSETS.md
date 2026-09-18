# Guest companion: asset register

Every photograph and map source used by the guest companion (`/welcome/`, `/travel/`,
`/stay/`, `/trip/`, `/wedding/`). The image metadata the site renders lives in
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

| Name                | Frame | Used on                  | Status     |
| ------------------- | ----- | ------------------------ | ---------- |
| `venue-aerial`      | 0     | Home hero                | Venue film |
| `pavilion-exterior` | 120   | The wedding, Home teaser | Venue film |
| `pavilion-interior` | 170   | The wedding              | Venue film |
| `stay-shangri-la`   | 420   | Stay (Shangri-La card)   | Venue film |

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

| Name             | Subject                | Author               | Licence      | Source                                                                                                 |
| ---------------- | ---------------------- | -------------------- | ------------ | ------------------------------------------------------------------------------------------------------ |
| `idea-nalusuan`  | Nalusuan island        | Martin Michlmayr     | CC BY-SA 4.0 | https://commons.wikimedia.org/wiki/File:Nalusuan_dive_trip_June_2025_067.jpg                           |
| `idea-bohol`     | Chocolate Hills, Bohol | Wolfgang Hägele      | CC BY-SA 4.0 | https://commons.wikimedia.org/wiki/File:Chocolate_Hills_Carmen_Bohol_2019.jpg                          |
| `idea-moalboal`  | Sardine run, Moalboal  | Iampjanz             | CC BY-SA 4.0 | https://commons.wikimedia.org/wiki/File:Sardine_run_over_seafloor_in_Moalboal_04.jpg                   |
| `idea-elnido`    | Bacuit Bay, El Nido    | Vyacheslav Argenberg | CC BY 4.0    | https://commons.wikimedia.org/wiki/File:Island_lagoon_in_Bacuit_Bay,_El_Nido,_Palawan,_Philippines.jpg |
| `arrive-airport` | Mactan-Cebu Terminal 2 | Ralff Nestor Nacor   | CC BY-SA 4.0 | https://commons.wikimedia.org/wiki/File:Outside_Mactan-Cebu_International_Airport_Terminal_2.jpg       |

## Map data

`src/data/mactan-geo.ts`: OpenStreetMap `natural=coastline` and `aeroway=runway` ways in the
box 10.255–10.36 N, 123.925–124.075 E, fetched on 18 Sep 2026 through the Overpass API. The
segments were joined into rings and simplified to about 20 m. © OpenStreetMap contributors,
ODbL; the credit appears on every map. There are no runtime map requests, tiles or keys.

To regenerate: run the same Overpass query, join the coastline ways by shared node ids into
rings, close the Cebu mainland along the western edge of the box, simplify (Douglas–Peucker,
about 20 m), and write the `[lat, lng]` rings in the same shape. The test suite checks that
every hotel and the airport still fall inside Mactan's ring.
