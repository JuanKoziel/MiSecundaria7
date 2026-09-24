"""Dump B12 target region (views.py 5323-5445) to a temp text file for a
reliable, single-source read."""
import io

p = r"C:\Users\eest n2\Documents\Secundaria 7\Mi Secundaria 7\backend\proyecto\escuela\views.py"
lines = io.open(p, encoding="utf-8").read().splitlines()
out = []
for n in range(5323, 5446):
    out.append("%d: %s" % (n + 1, lines[n]))
dst = r"C:\Users\eest n2\AppData\Local\Temp\opencode\b12_views5323.txt"
io.open(dst, "w", encoding="utf-8").write("\n".join(out))
print("WRITTEN", dst, len(out), "lines")
