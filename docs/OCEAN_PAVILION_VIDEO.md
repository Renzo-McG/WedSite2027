# Ocean Pavilion venue film

A production checkpoint between Save the Date v1.1 and v1.2. It replaced the temporary
Philippines concept media with authentic footage of the wedding venue and changed nothing
else about the invitation.

## Provenance

The film is the **Ocean Pavilion at Shangri-La Mactan**, cut from the resort's own
`Event-Spaces_low-res-version.mp4` Event Spaces film. This is real imagery of the wedding
location. It is not concept art, not AI-generated, and not documentary footage of
somewhere else standing in for Cebu.

A Canva-edited 4K export of the same section was supplied alongside the original and was
used only to identify which section was wanted. It was **not** used as the master: it is a
2× upscale of the same 1080p information with a 23.976 → 30 fps conversion, so it carries
no additional detail and adds duplicated-frame judder. The original was used instead.

Neither source file is committed. Both stay outside the repository.

## The cut

The Ocean Pavilion chapter runs from frame 1909 to frame 2370 of the source
(t 79.629 s → 98.849 s). Frame 1908 is the last frame of the preceding meeting-room shot,
and the source's white dissolve to the Shangri-La logo begins at frame 2371, so the cut
takes every clean frame of the chapter and nothing else.

| Property   | Value                                      |
| ---------- | ------------------------------------------ |
| Resolution | 1920×1080, native — no scaling of any kind |
| Frame rate | 23.976, native                             |
| Frames     | 462                                        |
| Duration   | 19.27 s                                    |
| Codec      | H.264 High, `yuv420p`, BT.709              |
| Audio      | none                                       |
| Size       | 10,203,157 bytes                           |
| Encoding   | x264 preset `slow`, CRF 21, `faststart`    |

Treatment was deliberately restrained: a light `hqdn3d` denoise to clear compression
mottling in the water and sky, and a small `eq` adjustment. No AI upscaling, no sharpening,
no LUT. CRF was chosen by measuring SSIM against a lossless reference of the graded trim —
CRF 19 scored 0.9938 at 13 MB, CRF 21 scored 0.9926 at 10.2 MB, CRF 22 scored 0.9919 at
9.0 MB. All three are visually transparent, so CRF 21 was taken as the practical balance.

```sh
ffmpeg -i Event-Spaces_low-res-version.mp4 \
  -vf "trim=start_frame=1909:end_frame=2371,setpts=PTS-STARTPTS,hqdn3d=2:1.5:3:3,eq=saturation=0.96:gamma=1.03:contrast=0.98,format=yuv420p" \
  -an -map_metadata -1 -c:v libx264 -preset slow -crf 21 -profile:v high -level 4.0 \
  -x264-params "ref=4:bframes=3" -color_primaries bt709 -color_trc bt709 -colorspace bt709 \
  -movflags +faststart public/assets/stage/video/venue-ocean-pavilion.mp4
```

## Known issue: the burned-in caption

The source film labels each venue on screen. The Ocean Pavilion caption fades in about
0.35 s into the cut and clears at about 4.6 s, sitting bottom-left in a light serif.

It is visible on the stage at every desktop width during the opening reveal. It was kept
rather than removed, because the caption sits over moving foliage and paving in a drifting
aerial shot, and `delogo` in that situation leaves a smeared patch that reads worse than
the text. On mobile the frame is cropped horizontally and the caption falls outside it.

If it should go, the clean fix is to start the cut after the caption clears — frame 2022
onwards gives a 14.5 s film — and to regenerate the poster from the new first frame. That
loses the opening aerial, which is the strongest shot in the chapter and the current
poster.

## Poster

`venue-ocean-pavilion-poster.webp` is frame 0 of the finished film, put through the same
grade, at WebP quality 88. Because it is the film's own first frame, the handoff from
poster to playback is invisible, and the same picture serves three jobs: the poster, the
no-JavaScript still, and the fallback when the video cannot play. `wedding.stage.image`
points at it for exactly that reason.

## Integration

The film is the only entry in `wedding.stage.videos`, so the existing per-session
selection always resolves to it. Behaviour it inherits from the v1.1 stage, unchanged:

- playback starts at the `seam-release` step of the opening sequence, on explicit user action;
- it plays once and rests on its final frame — no loop, no reset at the end;
- on reseal the final frame holds until the cover reaches `sealed`, and only then is the
  film paused and rewound, so the reset is never visible;
- `prefers-reduced-motion` leaves the poster in place and never starts playback;
- a failed source hides the video and shows the poster, and the invitation still opens.

`preload="metadata"` keeps the ~10 MB file off the critical path; the poster renders first.

Crop values live in `wedding.stage.videos` — desktop `50% 47%`, mobile `52% 50%`. Only the
horizontal component has any effect at common desktop and mobile sizes, since the 16:9 film
overflows horizontally at those aspect ratios; the vertical component matters on ultrawide.
