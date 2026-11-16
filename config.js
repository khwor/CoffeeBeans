// Speicherschlüssel – NICHT ändern, sonst sind die Daten weg
const KEY='kaffee-v1';

// Deckelfarben
const COLORS=['#e63946','#f4a261','#f1c40f','#2ecc71','#1abc9c','#3498db','#9b59b6','#e84393','#ecf0f1','#2d3436'];

// Auswahllisten
const PROCESSING=['Natural','Washed','Honey','Anaerob','Carbonic Maceration','Wet Hulled','Experimental'];
const ROAST=['Espresso','Omni','Filter'];
const PUCKPREP=['RDT''Shaker Funnel','Puck Screen','WDT','Leveler','Tamper','Papierfilter unten','Papierfilter oben',];

// Stepper: [Schrittweite, Minimum, Maximum]
const STEP={
  grind:[0.5,0,100],
  rpm:[50,0,3000],
  time:[1,0,120],
  dose:[0.1,0,40],
  yield:[0.5,0,100],
  temp:[0.5,70,100],
  rating:[0.5,0,5]
};
