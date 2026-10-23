from reportlab.pdfgen import canvas
from reportlab.lib.pagesizes import A4
from reportlab.lib.colors import HexColor, white
from reportlab.lib.utils import ImageReader
from reportlab.pdfbase.ttfonts import TTFont
from reportlab.pdfbase import pdfmetrics
from reportlab.lib.units import mm
from pathlib import Path
import math

ROOT = Path('/Users/ananyakolluru/Desktop/Projects/MathsNMe/MathsNMe_Website')
OUT = ROOT / 'output/pdf/sample-wayground-result-ananya.pdf'
LOGO = ROOT / 'public/maths-n-me-logo-full.png'
OUT.parent.mkdir(parents=True, exist_ok=True)

W, H = A4
NAVY = HexColor('#111827'); NAVY2 = HexColor('#1E293B'); GOLD = HexColor('#F4C542'); GOLD_DARK = HexColor('#8A6500')
GOLD2 = HexColor('#FFF3B8'); GREEN = HexColor('#22C55E'); GREEN_DARK = HexColor('#15803D')
GREEN_BG = HexColor('#EAFBF0'); BLUE = HexColor('#3B82F6'); BLUE_BG = HexColor('#EAF2FF')
PURPLE = HexColor('#8B5CF6'); PURPLE_BG = HexColor('#F1EAFF'); CORAL = HexColor('#F97360')
CREAM = HexColor('#FFF9EA'); INK = HexColor('#172033'); MUTED = HexColor('#64748B')
LINE = HexColor('#E7DEC4'); PALE = HexColor('#F8FAFC')

for name, path in [('Regular','/System/Library/Fonts/Supplemental/Arial.ttf'),('Bold','/System/Library/Fonts/Supplemental/Arial Bold.ttf')]:
    pdfmetrics.registerFont(TTFont(name,path))

c = canvas.Canvas(str(OUT), pagesize=A4)
c.setTitle('Ananya - Visual Assessment Report')
c.setAuthor('Maths n Me')

def rr(x,y,w,h,r,fill,stroke=None,lw=1):
    c.setFillColor(fill); c.setStrokeColor(stroke or fill); c.setLineWidth(lw)
    c.roundRect(x,y,w,h,r,fill=1,stroke=1 if stroke else 0)

def text(x,y,s,size=10,color=INK,font='Regular'):
    c.setFillColor(color); c.setFont(font,size); c.drawString(x,y,s)

def center(x,y,s,size=10,color=INK,font='Regular'):
    c.setFillColor(color); c.setFont(font,size); c.drawCentredString(x,y,s)

def wrap(x,y,s,max_chars,size=10,leading=14,color=INK,font='Regular'):
    words=s.split(); lines=[]; line=''
    for word in words:
        test=(line+' '+word).strip()
        if len(test)>max_chars and line: lines.append(line); line=word
        else: line=test
    if line: lines.append(line)
    for i,line in enumerate(lines): text(x,y-i*leading,line,size,color,font)
    return y-len(lines)*leading

def header(page_label):
    c.setFillColor(NAVY); c.rect(0,H-19*mm,W,19*mm,fill=1,stroke=0)
    c.drawImage(ImageReader(str(LOGO)),14*mm,H-15.2*mm,width=39*mm,height=10.5*mm,preserveAspectRatio=True,mask='auto')
    text(W-72*mm,H-11.8*mm,page_label.upper(),8,HexColor('#D8E0EE'),'Bold')

def footer(page):
    c.setStrokeColor(LINE); c.line(14*mm,12*mm,W-14*mm,12*mm)
    text(14*mm,7.5*mm,'Maths n Me  •  Transforming Student to Scholar',7,MUTED)
    c.setFillColor(MUTED); c.setFont('Regular',7); c.drawRightString(W-14*mm,7.5*mm,f'Page {page}')

def confetti():
    marks=[(18,742,GREEN),(34,721,PURPLE),(73,755,GOLD),(505,746,BLUE),(548,716,CORAL),(521,690,GREEN),(56,680,BLUE)]
    for x,y,col in marks:
        c.saveState(); c.translate(x,y); c.rotate((x+y)%35); c.setFillColor(col); c.roundRect(-4,-2,8,4,2,fill=1,stroke=0); c.restoreState()

def icon_check(cx,cy,r=11):
    c.setFillColor(GREEN); c.circle(cx,cy,r,fill=1,stroke=0)
    c.setStrokeColor(white); c.setLineWidth(2.3); c.line(cx-r*.48,cy,cx-r*.12,cy-r*.34); c.line(cx-r*.12,cy-r*.34,cx+r*.5,cy+r*.38)

def metric_card(x,y,w,h,bg,icon_color,icon_letter,value,label,sub=''):
    rr(x,y,w,h,12,bg)
    c.setFillColor(icon_color); c.circle(x+18,y+h-18,7,fill=1,stroke=0)
    center(x+18,y+h-20.5,icon_letter,7,white,'Bold')
    text(x+12,y+h-46,value,21,INK,'Bold')
    text(x+12,y+18,label.upper(),7.2,MUTED,'Bold')
    if sub: text(x+12,y+7,sub,6.5,MUTED)

# PAGE 1
header('Achievement report'); confetti()

rr(14*mm,H-79*mm,W-28*mm,52*mm,18,CREAM,GOLD,1.2)
text(22*mm,H-43*mm,'AMAZING WORK, ANANYA!',22,INK,'Bold')
text(22*mm,H-52*mm,'You are an Addition Superstar!',13,GREEN_DARK,'Bold')
text(22*mm,H-61*mm,'Addition Practice  •  Completed 24 October 2026',9,MUTED)

# Achievement medallion
cx=W-49*mm; cy=H-53*mm
# Keep the complete medallion inside the hero card with equal top/bottom breathing room.
c.setLineWidth(9); c.setStrokeColor(HexColor('#DDE4EE')); c.circle(cx,cy,22*mm,fill=0,stroke=1)
c.setStrokeColor(GREEN); c.arc(cx-22*mm,cy-22*mm,cx+22*mm,cy+22*mm,90,360)
c.setFillColor(white); c.circle(cx,cy,17.5*mm,fill=1,stroke=0)
center(cx,cy+3.5*mm,'100%',23,INK,'Bold'); center(cx,cy-5.5*mm,'ACCURACY',7.5,MUTED,'Bold')
rr(cx-15*mm,cy-16*mm,30*mm,6.5*mm,6.5,GREEN)
center(cx,cy-13.7*mm,'PASSED',7.5,white,'Bold')

text(14*mm,H-94*mm,'Your performance at a glance',15,INK,'Bold')
gap=4*mm; cardw=(W-28*mm-3*gap)/4; y=H-137*mm
metric_card(14*mm,y,cardw,33*mm,GREEN_BG,GREEN,'A','20 / 20','Correct answers')
metric_card(14*mm+cardw+gap,y,cardw,33*mm,BLUE_BG,BLUE,'S','3 sec','Average speed')
metric_card(14*mm+2*(cardw+gap),y,cardw,33*mm,PURPLE_BG,PURPLE,'C','20','Best streak')
metric_card(14*mm+3*(cardw+gap),y,cardw,33*mm,CREAM,GOLD,'P','15,900','Wayground score')

text(14*mm,H-151*mm,'Your 20-question journey',15,INK,'Bold')
rr(14*mm,H-187*mm,W-28*mm,28*mm,13,PALE,LINE,.7)
journey_left=25*mm; journey_right=W-25*mm; journey_step=(journey_right-journey_left)/9
for i in range(20):
    col=i%10; row=i//10
    x=journey_left+col*journey_step; yy=H-168*mm-row*8*mm
    c.setFillColor(GREEN); c.circle(x,yy,3.2*mm,fill=1,stroke=0)
    center(x,yy-1.3*mm,str(i+1),6.3,white,'Bold')
center(W/2,H-184*mm,'Every green circle is a correct answer - a perfect run!',8,GREEN_DARK,'Bold')

text(14*mm,H-201*mm,'What your result tells us',15,INK,'Bold')
box_y=H-242*mm; box_w=(W-32*mm)/2
rr(14*mm,box_y,box_w,33*mm,12,GREEN_BG)
icon_check(25*mm,box_y+22*mm,7)
text(36*mm,box_y+23*mm,'Strong accuracy',11,INK,'Bold')
wrap(36*mm,box_y+15*mm,'You solved every question correctly and cleared the 90% goal.',42,8.2,11,MUTED)
rr(18*mm+box_w,box_y,box_w,33*mm,12,BLUE_BG)
c.setFillColor(BLUE); c.circle(29*mm+box_w,box_y+22*mm,7,fill=1,stroke=0); center(29*mm+box_w,box_y+19.5*mm,'S',8,white,'Bold')
text(40*mm+box_w,box_y+23*mm,'Quick thinking',11,INK,'Bold')
wrap(40*mm+box_w,box_y+15*mm,'An average of 3 seconds shows fast and confident recall.',39,8.2,11,MUTED)

adventure_y=17*mm; adventure_h=32*mm
rr(14*mm,adventure_y,W-28*mm,adventure_h,13,NAVY)
text(22*mm,adventure_y+23*mm,'NEXT ADVENTURE',7,GOLD,'Bold')
text(22*mm,adventure_y+13.5*mm,'You are ready to move to the next exercise!',14,white,'Bold')
text(22*mm,adventure_y+6*mm,'Keep practising regularly to protect your speed and accuracy.',8,HexColor('#CBD5E1'))
c.setFillColor(GOLD); c.circle(W-28*mm,adventure_y+adventure_h/2,10*mm,fill=1,stroke=0); center(W-28*mm,adventure_y+adventure_h/2-3*mm,'>',19,NAVY,'Bold')
footer(1); c.showPage()

# PAGE 2
header('Question review')
text(14*mm,H-33*mm,'See how you solved it',21,INK,'Bold')
text(14*mm,H-41*mm,'Your answers matched the correct answers in every visible question.',9,MUTED)
rr(W-60*mm,H-45*mm,46*mm,16*mm,9,GREEN_BG)
icon_check(W-53*mm,H-37*mm,5)
text(W-46*mm,H-39.5*mm,'6 / 6 shown correct',8,GREEN_DARK,'Bold')

questions=[('1','33 + 53','86','3.8 sec'),('2','33 + 33','66','—'),('3','10 + 17','27','—'),('4','14 + 85','99','—'),('5','15 + 71','86','—'),('6','25 + 51','76','—')]
y=H-68*mm
for no,q,ans,secs in questions:
    rr(14*mm,y,W-28*mm,24*mm,11,white,LINE,.7)
    c.setFillColor(GREEN); c.circle(25*mm,y+12*mm,6.5*mm,fill=1,stroke=0); center(25*mm,y+9.6*mm,no,8.5,white,'Bold')
    text(36*mm,y+15*mm,q+' =',11,INK,'Bold')
    text(36*mm,y+7*mm,'Your answer',7,MUTED,'Bold'); text(62*mm,y+6.5*mm,ans,10,GREEN_DARK,'Bold')
    text(88*mm,y+7*mm,'Correct answer',7,MUTED,'Bold'); text(116*mm,y+6.5*mm,ans,10,INK,'Bold')
    text(139*mm,y+7*mm,'Time',7,MUTED,'Bold'); text(151*mm,y+6.5*mm,secs,9,INK,'Bold')
    y-=28*mm

result_y=30*mm; result_h=36*mm
rr(14*mm,result_y,W-28*mm,result_h,12,CREAM,GOLD,.8)
text(22*mm,result_y+25*mm,'A PERFECT RESULT!',8,GOLD_DARK,'Bold')
text(22*mm,result_y+15.5*mm,'All 20 questions were correct.',14,INK,'Bold')
text(22*mm,result_y+6.5*mm,'The final automatic report will display every question that Wayground makes available.',7.5,MUTED)
footer(2); c.save()
print(OUT)
