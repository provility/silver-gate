// Test to verify extraction matches API output exactly
// Reference: solution_set b9d66b3d-99bd-4ccb-8f4c-15cc1018ee6e

// Raw LaTeX content (simulating combinedContent from scanned items)
const rawContent = String.raw`\section*{Solutions}
1. (B)
$\lim _ { n \rightarrow \infty } \left( \frac { 1 } { 1 + n } + \ldots + \frac { 1 } { n + n } \right) = \lim _ { n \rightarrow \infty } \sum _ { r = 1 } ^ { n } \frac { 1 } { n + r }$
$= \lim _ { n \rightarrow \infty } \sum _ { r = 1 } ^ { n } \frac { 1 } { n } \left( \frac { 1 } { 1 + \frac { r } { n } } \right)$
$= \int _ { 0 } ^ { 1 } \frac { 1 } { 1 + x } d x = [ \ln ( 1 + x ) ] _ { 0 } ^ { 1 } = \ln 2$
2. (A)
$\begin{aligned}
& \sim ( q \vee ( ( \sim q ) \wedge p ) ) \\
& = \sim q \wedge \sim ( ( \sim q ) \wedge p ) \\
& = \sim q \wedge ( q \vee \sim p ) \\
& = ( \sim q \wedge q ) \vee ( \sim q \wedge \sim p ) \\
& = ( \sim q \wedge \sim p )
\end{aligned}$
3. (B)
$n p + n p q = 5 , n p \cdot n p q = 6$
$n p ( 1 + q ) = 5 , n ^ { 2 } p ^ { 2 } q = 6$
$n ^ { 2 } p ^ { 2 } ( 1 + q ) ^ { 2 } = 25 , n ^ { 2 } p ^ { 2 } q = 6$
$\frac { 6 } { q } ( 1 + q ) ^ { 2 } = 25$
$6 q ^ { 2 } + 12 q + 6 = 25 q$
$6 q ^ { 2 } - 13 q + 6 = 0$
$6 q ^ { 2 } - 9 q - 4 q + 6 = 0$
$( 3 q - 2 ) ( 2 q - 3 ) = 0$
$q = \frac { 2 } { 3 } , \frac { 3 } { 2 } , q = \frac { 2 } { 3 }$ is accepted
$p = \frac { 1 } { 3 } \Rightarrow n \cdot \frac { 1 } { 3 } + n \cdot \frac { 1 } { 3 } \cdot \frac { 2 } { 3 } = 5$
$\frac { 3 n + 2 n } { 9 } = 5$
$n = 9$
So $6 ( n + p - q ) = 6 \left( 9 + \frac { 1 } { 3 } - \frac { 2 } { 3 } \right) = 52$
4. (B)
$\begin{aligned}
& T _ { r } = \frac { ( r ^ { 2 } + r + 1 ) - ( r ^ { 2 } - r + 1 ) } { 2 ( r ^ { 4 } + r ^ { 2 } + 1 ) } \\
& \Rightarrow T _ { r } = \frac { 1 } { 2 } \left[ \frac { 1 } { r ^ { 2 } - r + 1 } - \frac { 1 } { r ^ { 2 } + r + 1 } \right]
\end{aligned}$
$T _ { 1 } = \frac { 1 } { 2 } \left[ \frac { 1 } { 1 } - \frac { 1 } { 3 } \right]$
$T _ { 2 } = \frac { 1 } { 2 } \left[ \frac { 1 } { 3 } - \frac { 1 } { 7 } \right]$
5. (B)
$\begin{gathered}
\sum _ { r = 1 } ^ { 26 } \frac { 1 } { ( 2 r - 1 ) ! ( 51 - ( 2 r - 1 ) ) ! } = \sum _ { r = 1 } ^ { 26 } { } ^ { 51 } C _ { ( 2 r - 1 ) } \frac { 1 } { 51 ! } \left[ \sum { } ^ { n } C _ { 2 r - 1 } = 2 ^ { n - 1 } \right] \\
= \frac { 1 } { 51 ! } \left\{ { } ^ { 51 } C _ { 1 } + { } ^ { 51 } C _ { 3 } + \ldots + { } ^ { 51 } C _ { 51 } \right\} = \frac { 1 } { 51 ! } \left( 2 ^ { 50 } \right)
\end{gathered}$
6. (D)
![](https://cdn.mathpix.com/cropped/e9b73bf5-0740-4f61-9d85-6f61a0d7a615-03.jpg?height=469&width=964&top_left_y=310&top_left_x=130)
$m = - \frac { 1 } { 2 }$
When two lines are perpendicular, then $m _ { 1 } \cdot m _ { 2 } = - 1$
Here $\mathrm { mBH } \times \mathrm { mAC } = - 1$
$\begin{gathered}
\left( \frac { \beta - 3 } { \alpha - 2 } \right) \left( \frac { 1 } { - 2 } \right) = - 1 \\
\beta - 3 = 2 \alpha - 4 \\
\beta = 2 \alpha - 1 \\
m _ { A H } \times m _ { B C } = - 1 \\
\Rightarrow \left( \frac { \beta - 2 } { \alpha - 1 } \right) ( - 2 ) = - 1 \\
\Rightarrow 2 \beta - 4 = \alpha - 1 \\
\Rightarrow 2 ( 2 \alpha - 1 ) = \alpha + 3 \\
\Rightarrow 3 \alpha = 5 \\
\alpha = \frac { 5 } { 3 } , \beta = \frac { 7 } { 3 } \Rightarrow H \left( \frac { 5 } { 3 } , \frac { 7 } { 3 } \right) \\
\alpha + 4 \beta = \frac { 5 } { 3 } + \frac { 28 } { 3 } = \frac { 33 } { 3 } = 11 \\
\beta + 4 \alpha = \frac { 7 } { 3 } + \frac { 20 } { 3 } = \frac { 27 } { 3 } = 9 \\
x ^ { 2 } - 20 x + 99 = 0
\end{gathered}$
7. (D)
![](https://cdn.mathpix.com/cropped/e9b73bf5-0740-4f61-9d85-6f61a0d7a615-04.jpg?height=533&width=867&top_left_y=260&top_left_x=173)
If $\cos 2 A + \cos 2 B + \cos 2 C$ is minimum then $\mathrm { A } = \mathrm { B } = \mathrm { C } = 60 ^ { \circ }$
So $\triangle \mathrm { ABC }$ is equilateral
Now in-radius $\mathrm { r } = 3$
So in $\triangle \mathrm { MBD }$ we have
$\tan 30 ^ { \circ } = \frac { MD } { BD } = \frac { r } { a / 2 } = \frac { 6 } { a }$
$1 / \sqrt { 3 } = \frac { 6 } { a } \Rightarrow a = 6 \sqrt { 3 }$
Perimeter of $\triangle \mathrm { ABC } = 18 \sqrt { 3 }$
Area of $\triangle \mathrm { ABC } = \frac { \sqrt { 3 } } { 4 } a ^ 2 = 27 \sqrt { 3 }$
8. (D)
Equation of the pair of angle bisector for the homogenous equation $a x ^ { 2 } + 2 h x y + b y ^ { 2 } = 0$ is given as $\frac { x ^ { 2 } - y ^ { 2 } } { a - b } = \frac { x y } { h }$
Here $a = 2 , h = \frac { 1 } { 2 }$ & $b = - 3$
Equation will become
9. (C)
Shortest distance between two lines
$\begin{aligned}
& \frac { x - x _ { 1 } } { a _ { 1 } } = \frac { y - y _ { 1 } } { a _ { 2 } } = \frac { z - z _ { 1 } } { a _ { 3 } } \\
& \frac { x - x _ { 2 } } { b _ { 1 } } = \frac { y - y _ { 2 } } { b _ { 2 } } = \frac { z - z _ { 2 } } { b _ { 3 } }
\end{aligned}$
is given as
$\begin{gathered}
\frac { \left| \begin{array} { c c c }
x _ { 1 } - x _ { 2 } & y _ { 1 } - y _ { 2 } & z _ { 1 } - z _ { 2 } \\
a _ { 1 } & a _ { 2 } & a _ { 3 } \\
b _ { 1 } & b _ { 2 } & b _ { 3 }
\end{array} \right| } { \sqrt { \left( a _ { 2 } b _ { 3 } - a _ { 3 } b _ { 2 } \right) ^ { 2 } + \left( a _ { 1 } b _ { 3 } - a _ { 3 } b _ { 1 } \right) ^ { 2 } + \left( a _ { 1 } b _ { 2 } - a _ { 2 } b _ { 1 } \right) ^ { 2 } } } \\
\frac { \left| \begin{array} { c c c }
5 - 3 & 2 - ( - 5 ) & 4 - 1 \\
1 & 2 & - 3 \\
1 & 4 & - 5
\end{array} \right| } { \sqrt { ( - 10 + 12 ) ^ { 2 } + ( - 5 + 3 ) ^ { 2 } + ( 4 - 2 ) ^ { 2 } } } \\
\frac { \left| \begin{array} { c c c }
8 & 7 & 3 \\
1 & 2 & - 3 \\
1 & 4 & - 5
\end{array} \right| } { \sqrt { ( 2 ) ^ { 2 } + ( 2 ) ^ { 2 } + ( 2 ) ^ { 2 } } } \\
= \frac { | 8 ( - 10 + 12 ) - 7 ( - 5 + 3 ) + 3 ( 4 - 2 ) | } { \sqrt { 4 + 4 + 4 } } \\
= \frac { 16 + 14 + 6 } { \sqrt { 12 } } = \frac { 36 } { \sqrt { 12 } } = \frac { 36 } { 2 \sqrt { 3 } } = \frac { 18 } { \sqrt { 3 } } = 6 \sqrt { 3 }
\end{gathered}$
10. (D)
$| \begin{array} { c c c } \lambda & 1 & 1 \\ 1 & \lambda & 1 \\ 1 & 1 & \lambda \end{array} | = 0$
$( \lambda + 2 ) | \begin{array} { c c c } 1 & 1 & 1 \\ 1 & \lambda & 1 \\ 1 & 1 & \lambda \end{array} | = 0$
$( \lambda + 2 ) [ 1 ( \lambda ^ { 2 } - 1 ) - 1 ( \lambda - 1 ) + ( 1 - \lambda ) ] = 0$
$( \lambda + 2 ) [ ( \lambda ^ { 2 } - 2 \lambda + 1 ) ] = 0$
$( \lambda + 2 ) ( \lambda - 1 ) ^ { 2 } = 0 \Rightarrow \lambda = - 2 , \lambda = 1$
at $\lambda = 1$ system has infinite solution, for inconsistent $\lambda = - 2$
so, $\Sigma ( | - 2 | ^ { 2 } + | - 2 | ) = 6$
11. (B)
Let
$\begin{gathered}
( \sqrt { 3 } + \sqrt { 2 } ) ^ { x ^ { 2 } - 4 } = t \\
t + \frac { 1 } { t } = 10 \\
\Rightarrow t = 5 + 2 \sqrt { 6 } , 5 - 2 \sqrt { 6 } \\
\Rightarrow ( \sqrt { 3 } + \sqrt { 2 } ) ^ { x ^ { 2 } - 4 } = 5 + 2 \sqrt { 6 } , 5 - 2 \sqrt { 6 } \\
\Rightarrow x ^ { 2 } - 4 = 2 , - 2 \text { or } x ^ { 2 } = 6 , 2 \\
\Rightarrow x = \pm \sqrt { 2 } , \pm \sqrt { 6 }
\end{gathered}$
12. (B)
$\cos ^ { - 1 } ( 2 x ) = \pi + 2 \cos ^ { - 1 } ( \sqrt { 1 - x ^ { 2 } } )$
LHS $= [ 0 , \pi ]$
For equation to be meaningful
$\cos ^ { - 1 } 2 x = \pi$ and $\cos ^ { - 1 } ( \sqrt { 1 - x ^ { 2 } } ) = 0$
$x = \frac { - 1 } { 2 }$ and $x = 0$
which is not possible
$\therefore x \in \emptyset$
Now $\Sigma ( x ) = 0$
∴ Sum over empty set is always 0
13. (D)
$\begin{gathered}
\sqrt { ( x - 2 ) ^ { 2 } + y ^ { 2 } } = 2 \sqrt { ( x - 3 ) ^ { 2 } + y ^ { 2 } } \\
= x ^ { 2 } + y ^ { 2 } - 4 x + 4 = 4 x ^ { 2 } + 4 y ^ { 2 } - 24 x + 36 \\
= 3 x ^ { 2 } + 3 y ^ { 2 } - 20 x + 32 = 0 \\
= x ^ { 2 } + y ^ { 2 } - \frac { 20 } { 3 } x + \frac { 32 } { 3 } = 0 \\
= ( \alpha , \beta ) = \left( \frac { 10 } { 3 } , 0 \right) \\
\gamma = \sqrt { \frac { 100 } { 9 } - \frac { 32 } { 3 } } = \sqrt { \frac { 4 } { 9 } } = \frac { 2 } { 3 } \\
3 ( \alpha , \beta , \gamma ) = 3 \left( \frac { 10 } { 3 } + \frac { 2 } { 3 } \right) = 12
\end{gathered}$
14. (A)
Here I.F. $= \sec x$ (Linear Differential Equation)
Then solution of D.E:
$y ( \sec x ) = x \tan x - \ln ( \sec x ) + c$
Given $y ( 0 ) = 1 \Rightarrow c = 1$
$\therefore y ( \sec x ) = x \tan x - \ln ( \sec x ) + 1$
At $x = \frac { \pi } { 6 } , y = \frac { \pi } { 12 } + \frac { \sqrt { 3 } } { 2 } \ln \frac { \sqrt { 3 } } { 2 } + \frac { \sqrt { 3 } } { 2 }$
15. (A)
Check for reflexivity:
As $3 ( a - a ) + \sqrt { 7 } = \sqrt { 7 }$ which belongs to relation so relation is reflexive.
Check for symmetric:
Take $a = \frac { \sqrt { 7 } } { 3 } , b = 0$
Now $( a , b ) \in R$ but $( b , a ) \notin R$
As $3 ( b - a ) + \sqrt { 7 } = 0$ which is rational so relation is not symmetric.
Check for Transitivity:
Take $( a , b )$ as $\left( \frac { \sqrt { 7 } } { 3 } , 1 \right)$ & $( b , c )$ as $\left( 1 , \frac { 2 \sqrt { 7 } } { 3 } \right)$
So now $( a , b ) \in R$ & $( b , c ) \in R$ but $( a , c ) \notin R$ which means relation is not transitive.
16. (D)
eq. of line PM $\frac { x - 2 } { 1 } = \frac { y + 1 } { 2 } = \frac { z - 3 } { - 1 } = \lambda$
any point on line $= ( \lambda + 2 , 2 \lambda - 1 , - \lambda + 3 )$
for point 'm' $( \lambda + 2 ) + 2 ( 2 \lambda - 1 ) - ( 3 - \lambda ) = 0$
$\lambda = \frac { 1 } { 2 }$
Point m $\left( \frac { 1 } { 2 } + 2 , 2 \times \frac { 1 } { 2 } - 1 , \frac { - 1 } { 2 } + 3 \right)$
$= \left( \frac { 5 } { 2 } , 0 , \frac { 5 } { 2 } \right)$
For Image Q $( \alpha , \beta , \gamma )$
$\frac { \alpha + 2 } { 2 } = \frac { 5 } { 2 } , \frac { \beta - 1 } { 2 } = 0$
17. (A)
$C _ { 1 } \rightarrow C _ { 1 } + C _ { 2 } + C _ { 3 }$
$f ( x ) = \left| \begin{array} { c c c } 2 + \sin 2 x & \cos ^ { 2 } x & \sin 2 x \\ 2 + \sin 2 x & 1 + \cos ^ { 2 } x & \sin 2 x \\ 2 + \sin 2 x & \cos ^ { 2 } x & 1 + \sin 2 x \end{array} \right|$
$f ( x ) = ( 2 + \sin 2 x ) \left| \begin{array} { c c c } 1 & \cos ^ { 2 } x & \sin 2 x \\ 1 & 1 + \cos ^ { 2 } x & \sin 2 x \\ 1 & \cos ^ { 2 } x & 1 + \sin 2 x \end{array} \right|$
$R _ { 2 } \rightarrow R _ { 2 } - R _ { 1 }$
$R _ { 3 } \rightarrow R _ { 3 } - R _ { 1 }$
$f ( x ) = ( 2 + \sin 2 x ) \left| \begin{array} { c c c } 1 & \cos ^ { 2 } x & \sin 2 x \\ 0 & 1 & 0 \\ 0 & 0 & 1 \end{array} \right|$
$= ( 2 + \sin 2 x ) ( 1 ) = 2 + \sin 2 x$
$\sin 2 x \in \left[ \frac { \sqrt { 3 } } { 2 } , 1 \right]$
Hence $2 + \sin 2 x \in \left[ 2 + \frac { \sqrt { 3 } } { 2 } , 3 \right]$
18. (B)
$f ( x ) = 2 x + \tan ^ { - 1 } x$ and $g ( x ) = \ln \left( \sqrt { 1 + x ^ { 2 } } + x \right)$
and $x \in [ 0 , 3 ]$
$g ' ( x ) = \frac { 1 } { \sqrt { 1 + x ^ { 2 } } }$
Now, $0 \leq x \leq 3$
$0 \leq x ^ { 2 } \leq 9$
$1 \leq 1 + x ^ { 2 } \leq 10$
So, $2 + \frac { 1 } { 10 } \leq f ' ( x ) \leq 3$
$\frac { 21 } { 10 } \leq f ' ( x ) \leq 3$ and $\frac { 1 } { \sqrt { 10 } } \leq g ' ( x ) \leq 1$
option (4) is incorrect
From above, $g ' ( x ) < f ' ( x ) \forall x \in [ 0 , 3 ]$
Option (1) is incorrect.
$f ' ( x ) \& g ' ( x )$ both positive so $f ( x ) \& g ( x )$ both are increasing
So, $\max ( f ( x ) )$ at $x = 3$ is $6 + \tan ^ { - 1 } 3$
$\text { Max } ( g ( x ) )$ at $x = 3$ is $\ln ( 3 + \sqrt { 10 } )$
And $6 + \tan ^ { - 1 } 3 > \ln ( 3 + \sqrt { 10 } )$
Option (2) is correct.
19. (A)
$\frac { 1 + 3 + 5 + a + b } { 5 } = 5$
$a + b = 16$
$\sigma ^ { 2 } = \frac { \sum x _ { i } ^ { 2 } } { 5 } - \left( \frac { \sum x } { 5 } \right) ^ { 2 }$
$8 = \frac { 1 ^ { 2 } + 3 ^ { 2 } + 5 ^ { 2 } + a ^ { 2 } + b ^ { 2 } } { 5 } - 25$
$a ^ { 2 } + b ^ { 2 } = 130$
By (1), (2)
$a = 7 , b = 9$
or $a = 9 , b = 7$
20. (D)
$\frac { d y } { d x } + \frac { x + a } { y - 2 } = 0$
$\frac { d y } { d x } = \frac { x + a } { 2 - y }$
$( 2 - y ) d y = ( x + a ) d x$
$2 y - \frac { y ^ { 2 } } { 2 } = \frac { x ^ { 2 } } { 2 } + a x + c$
$a + c = - \frac { 1 } { 2 }$ as $y ( 1 ) = 0$
$x ^ { 2 } + y ^ { 2 } + 2 a x - 4 y - 1 - 2 a = 0$
$\pi r ^ { 2 } = 4 \pi$
$r ^ { 2 } = 4$
$4 = \sqrt { a ^ { 2 } + 4 + 1 + 2 a }$
$( a + 1 ) ^ { 2 } = 0$
$P , Q = ( 0 , 2 \pm \sqrt { 3 } )$
21. (754.00)
$a _ { 1 } + a _ { 2 } + a _ { 3 } + a _ { 4 } = 50$
$\Rightarrow 32 + 6 d = 50$
$\Rightarrow d = 3$
and, $a _ { n - 3 } + a _ { n - 2 } + a _ { n - 1 } + a _ { n } = 170$
$\Rightarrow 32 + ( 4 n - 10 ) \cdot 3 = 170$
$\Rightarrow n = 14$
$a _ { 7 } = 26 , a _ { 8 } = 29$
$\Rightarrow a _ { 7 } \cdot a _ { 8 } = 754$
22. (11.00)
![](https://cdn.mathpix.com/cropped/e9b73bf5-0740-4f61-9d85-6f61a0d7a615-12.jpg?height=611&width=743&top_left_y=269&top_left_x=164)
$A ( 2,6,2 ) B ( - 4,0 , \lambda ) , C ( 2,3 , - 1 ) D ( 4,5,0 )$
$\begin{gathered}
\text { Area } = \frac { 1 } { 2 } | \overrightarrow { B D } \times \overrightarrow { A C } | = 18 \\
\overrightarrow { A C } \times \overrightarrow { B D } = \left| \begin{array} { c c c }
\hat { i } & j & k \\
0 & - 3 & - 3 \\
8 & 5 & - \lambda
\end{array} \right| \\
= ( 3 \lambda + 15 ) \vec { i } - j ( - 24 ) + k ( - 24 )
\end{gathered}$
$\begin{gathered}
\overrightarrow { A C } \times \overrightarrow { B D } = ( 3 \lambda + 15 ) \hat { i } + 24 j - 24 k \\
= \sqrt { ( 3 \lambda + 15 ) ^ { 2 } + ( 24 ) ^ { 2 } + ( 24 ) ^ { 2 } } = 36 \\
= \lambda ^ { 2 } + 10 \lambda + 9 = 0 = \lambda = - 1 , - 9 \\
| \lambda | \leq 5 \Rightarrow \lambda = - 1 \\
5 - 6 \lambda = 5 - 6 ( - 1 ) = 11
\end{gathered}$
23. (514.00)
Divisible by $2 \rightarrow 450$
Divisible by $3 \rightarrow 300$
Divisible by $7 \rightarrow 128$
Divisible by 2 and $7 \rightarrow 64$
Divisible by 3 and $7 \rightarrow 43$
Divisible by 2 and $3 \rightarrow 150$
Divisible by 2,3 and $7 \rightarrow 21$
∴ Total numbers $= 450 + 300 - 150 - 64 - 43 + 21 = 514$
24. (29.00)
$( 21 + 2 ) ^ { 200 } + ( 21 - 2 ) ^ { 200 }$
$\Rightarrow 2 \left[ { } ^ { 200 } \mathrm { C } _ { 0 } 2 ^ { 200 } + { } ^ { 200 } \mathrm { C } _ { 2 } 21 ^ { 198 } \cdot 2 ^ { 2 } + \ldots + { } ^ { 200 } \mathrm { C } _ { 198 } 21 ^ { 2 } \cdot 2 ^ { 198 } + 2 ^ { 200 } \right]$
$\Rightarrow 2 \left[ 49 I _ { 1 } + 2 ^ { 200 } \right] = 49 I _ { 1 } + 2 ^ { 201 }$
Now, $2 ^ { 201 } = ( 8 ) ^ { 67 } = ( 1 + 7 ) ^ { 67 } = 49 I _ { 2 } + { } ^ { 67 } \mathrm { C } _ { 0 } { } ^ { 67 } \mathrm { C } _ { 1 } \cdot 7 = 49 I _ { 2 } + 470 = 49 I _ { 2 } + 49 \times 9 + 29$
∴ Remainder is 29
25. (63.00)
$\int ( x ^ { 20 } + x ^ { 13 } + x ^ { 6 } ) ( 2 x ^ { 21 } + 3 x ^ { 14 } + 6 x ^ { 7 } ) ^ { \frac { 1 } { 7 } } d x$
$2 x ^ { 21 } + 3 x ^ { 14 } + 6 x ^ { 7 } = t$
$42 ( x ^ { 20 } + x ^ { 13 } + x ^ { 6 } ) d x = d t$
26. (14.00)
$f ( x ) = x ^ { 2 } + g ' ' ( 1 ) x + g ' ' ( 2 )$
$f ' ( x ) = 2 x + g ' ( 1 )$
$f ' ' ( x ) = 2$
$g ( x ) = f ( 1 ) x ^ { 2 } + x [ 2 x + g ' ( 1 ) ] + 2$
$g ' ' ( x ) = 2 f ( 1 ) x + 4 x + g ' ' ( 1 )$
$g ' ' ( x ) = 2 f ( 1 ) + 4$
$g ' ' ( x ) = 0$
$2 f ( 1 ) + 4 = 0$
$f ( 1 ) = - 2$
$- 2 = 1 + g ' ( 1 ) = g ' ( 1 ) = - 3$
So, $f ' ( x ) = 2 x - 3$
$f ( x ) = x ^ { 2 } - 3 x + c$
$c = 0$
$f ( x ) = x ^ { 2 } - 3 x$
$g ( x ) = - 3 x + 2$
$f ( 4 ) - g ( 4 ) = 14$
27. (3501.00)
$[ \vec { u } \vec { v } \vec { w } ] = \vec { u } \cdot ( \vec { v } \times \vec { w } )$
$\min . ( | \vec { u } | | \vec { v } \times \vec { w } | \cos \theta ) = - \alpha \sqrt { 3401 }$
$\Rightarrow \cos \theta = - 1$
$| \vec { u } | = \alpha$ (Given)
$| \vec { v } \times \vec { w } | = \sqrt { 3401 }$
$\vec { v } \times \vec { w } = \begin{vmatrix} \hat { i } & \hat { j } & \hat { k } \\ \alpha & 2 & - 3 \\ 2 \alpha & 1 & - 1 \end{vmatrix}$
$\vec { v } \times \vec { w } = \hat { i } - 5 \alpha \hat { j } - 3 \alpha \hat { k }$
$| \vec { v } \times \vec { w } | = \sqrt { 1 + 25 \alpha ^ { 2 } + 9 \alpha ^ { 2 } } = \sqrt { 3401 }$
$34 \alpha ^ { 2 } = 3400$
$\alpha ^ { 2 } = 100$
$\alpha = 10$ (as $\alpha > 0$)
So $\vec { u } = \lambda ( \hat { i } - 5 \alpha \hat { j } - 3 \alpha \hat { k } )$
$| \vec { u } | = \sqrt { \lambda ^ { 2 } + 25 \alpha ^ { 2 } \lambda ^ { 2 } + 9 \alpha ^ { 2 } \lambda ^ { 2 } }$
$\alpha ^ { 2 } = \lambda ^ { 2 } ( 1 + 25 \alpha ^ { 2 } + 9 \alpha ^ { 2 } )$
$100 = \lambda ^ { 2 } ( 1 + 34 \times 100 )$
$\lambda ^ { 2 } = \frac { 100 } { 3401 } = \frac { m } { n }$
28. (50400.00)
Vowels: A,A,A,I,I,O
Consonants: S,S,S,S,N,N,T
$\therefore$ Total number of ways in which vowels come together
$= \frac { 8 ! } { 4 ! 2 ! } \times \frac { 6 ! } { 3 ! 2 ! } = 50400$
29. (62.00)
$A = \int _ { - 1 } ^ { 0 } ( x ^ { 2 } - 3 x ) d x + \int _ { 0 } ^ { 2 } ( 3 x - x ^ { 2 } ) d x$
$\Rightarrow A = \left. \frac { x ^ { 3 } } { 3 } - \frac { 3 x ^ { 2 } } { 2 } \right| _ { - 1 } ^ { 0 } + \left. \frac { 3 x ^ { 2 } } { 2 } - \frac { x ^ { 3 } } { 3 } \right| _ { 0 } ^ { 2 }$
$\Rightarrow A = \frac { 11 } { 6 } + \frac { 10 } { 3 } = \frac { 31 } { 6 }$
$\therefore 12 A = 62$
30. (1.00)
$\begin{aligned}
& \frac { d y } { d x } + y = k \\
& y \cdot e ^ { x } = k \cdot e ^ { x } + c \\
& f ( 0 ) = e ^ { - 2 } \\
& \Rightarrow c = e ^ { - 2 } - k \\
& \therefore y = k + ( e ^ { - 2 } - k ) e ^ { - x }
\end{aligned}$
now
$\begin{aligned}
& \Rightarrow k = e ^ { - 2 } - 1 \\
& \therefore y = ( e ^ { - 2 } - 1 ) + e ^ { - x } \\
& f ( 2 ) = 2 e ^ { - 2 } - 1 , f ( 0 ) = e ^ { - 2 } \\
& 2 f ( 0 ) - f ( 2 ) = 1
\end{aligned}$
`;

// Expected API output (from solution_set b9d66b3d-99bd-4ccb-8f4c-15cc1018ee6e)
const expectedSolutions = {
  "2": `$\\begin{aligned} & \\sim (q \\vee ((\\sim q) \\wedge p)) \\\\ & = \\sim q \\wedge \\sim ((\\sim q) \\wedge p) \\\\ & = \\sim q \\wedge (q \\vee \\sim p) \\\\ & = (\\sim q \\wedge q) \\vee (\\sim q \\wedge \\sim p) \\\\ & = (\\sim q \\wedge \\sim p) \\end{aligned}$`,

  "6": `$m = -\\frac{1}{2}$\nWhen two lines are perpendicular, then $m_1 \\cdot m_2 = -1$\nHere $\\mathrm{mBH} \\times \\mathrm{mAC} = -1$\n$\\begin{gathered} \\left(\\frac{\\beta-3}{\\alpha-2}\\right)\\left(\\frac{1}{-2}\\right) = -1 \\\\ \\beta-3 = 2\\alpha-4 \\\\ \\beta = 2\\alpha-1 \\\\ m_{AH} \\times m_{BC} = -1 \\\\ \\Rightarrow \\left(\\frac{\\beta-2}{\\alpha-1}\\right)(-2) = -1 \\\\ \\Rightarrow 2\\beta-4 = \\alpha-1 \\\\ \\Rightarrow 2(2\\alpha-1) = \\alpha+3 \\\\ \\Rightarrow 3\\alpha = 5 \\\\ \\alpha = \\frac{5}{3}, \\beta = \\frac{7}{3} \\Rightarrow H\\left(\\frac{5}{3}, \\frac{7}{3}\\right) \\\\ \\alpha+4\\beta = \\frac{5}{3}+\\frac{28}{3} = \\frac{33}{3} = 11 \\\\ \\beta+4\\alpha = \\frac{7}{3}+\\frac{20}{3} = \\frac{27}{3} = 9 \\\\ x^2-20x+99 = 0 \\end{gathered}$`,

  "9": `Shortest distance between two lines\n$\\begin{aligned} & \\frac{x-x_1}{a_1} = \\frac{y-y_1}{a_2} = \\frac{z-z_1}{a_3} \\\\ & \\frac{x-x_2}{b_1} = \\frac{y-y_2}{b_2} = \\frac{z-z_2}{b_3} \\end{aligned}$\nis given as\n$\\begin{gathered} \\frac{|\\begin{array}{ccc} x_1-x_2 & y_1-y_2 & z_1-z_2 \\\\ a_1 & a_2 & a_3 \\\\ b_1 & b_2 & b_3 \\end{array}|}{\\sqrt{(a_2b_3-a_3b_2)^2+(a_1b_3-a_3b_1)^2+(a_1b_2-a_2b_1)^2}} \\\\ \\frac{|\\begin{array}{ccc} 5-3 & 2-(-5) & 4-1 \\\\ 1 & 2 & -3 \\\\ 1 & 4 & -5 \\end{array}|}{\\sqrt{(-10+12)^2+(-5+3)^2+(4-2)^2}} \\\\ \\frac{|\\begin{array}{ccc} 8 & 7 & 3 \\\\ 1 & 2 & -3 \\\\ 1 & 4 & -5 \\end{array}|}{\\sqrt{(2)^2+(2)^2+(2)^2}} \\\\ = \\frac{|8(-10+12)-7(-5+3)+3(4-2)|}{\\sqrt{4+4+4}} \\\\ = \\frac{16+14+6}{\\sqrt{12}} = \\frac{36}{\\sqrt{12}} = \\frac{36}{2\\sqrt{3}} = \\frac{18}{\\sqrt{3}} = 6\\sqrt{3} \\end{gathered}$`,

  "13": `$\\begin{gathered} \\sqrt{(x-2)^2 + y^2} = 2\\sqrt{(x-3)^2 + y^2} \\\\ = x^2 + y^2 - 4x + 4 = 4x^2 + 4y^2 - 24x + 36 \\\\ = 3x^2 + 3y^2 - 20x + 32 = 0 \\\\ = x^2 + y^2 - \\frac{20}{3}x + \\frac{32}{3} = 0 \\\\ = (\\alpha, \\beta) = \\left(\\frac{10}{3}, 0\\right) \\\\ \\gamma = \\sqrt{\\frac{100}{9} - \\frac{32}{3}} = \\sqrt{\\frac{4}{9}} = \\frac{2}{3} \\\\ 3(\\alpha, \\beta, \\gamma) = 3\\left(\\frac{10}{3} + \\frac{2}{3}\\right) = 12 \\end{gathered}$`,

  "22": `$A(2,6,2) B(-4,0,\\lambda), C(2,3,-1) D(4,5,0)$\n$\\begin{gathered} \\text{Area} = \\frac{1}{2}|\\overrightarrow{BD} \\times \\overrightarrow{AC}| = 18 \\\\ \\overrightarrow{AC} \\times \\overrightarrow{BD} = \\left|\\begin{array}{ccc} \\hat{i} & j & k \\\\ 0 & -3 & -3 \\\\ 8 & 5 & -\\lambda \\end{array}\\right| \\\\ = (3\\lambda + 15)\\vec{i} - j(-24) + k(-24) \\end{gathered}$\n$\\begin{gathered} \\overrightarrow{AC} \\times \\overrightarrow{BD} = (3\\lambda + 15)\\hat{i} + 24j - 24k \\\\ = \\sqrt{(3\\lambda + 15)^2 + (24)^2 + (24)^2} = 36 \\\\ = \\lambda^2 + 10\\lambda + 9 = 0 = \\lambda = -1, -9 \\\\ |\\lambda| \\leq 5 \\Rightarrow \\lambda = -1 \\\\ 5 - 6\\lambda = 5 - 6(-1) = 11 \\end{gathered}$`,

  "30": `$\\begin{aligned} & \\frac{dy}{dx} + y = k \\\\ & y \\cdot e^{x} = k \\cdot e^{x} + c \\\\ & f(0) = e^{-2} \\\\ & \\Rightarrow c = e^{-2} - k \\\\ & \\therefore y = k + (e^{-2} - k) e^{-x} \\end{aligned}$\nnow\n$\\begin{aligned} & \\Rightarrow k = e^{-2} - 1 \\\\ & \\therefore y = (e^{-2} - 1) + e^{-x} \\\\ & f(2) = 2e^{-2} - 1, f(0) = e^{-2} \\\\ & 2f(0) - f(2) = 1 \\end{aligned}$`
};

// Functions from the service (copied for testing)
function formatLatexBlocks(content) {
  const blockPattern = /\$\\begin\{(\w+)\}([\s\S]*?)\\end\{\1\}\$/g;
  return content.replace(blockPattern, (match, envName, innerContent) => {
    const formatted = innerContent
      .split('\n')
      .map(line => line.trim())
      .filter(line => line.length > 0)
      .join(' ');
    return `$\\begin{${envName}} ${formatted} \\end{${envName}}$`;
  });
}

function extractVisualPaths(solutions, rawContent) {
  for (const solution of solutions) {
    const questionLabel = solution.question_label;
    if (!questionLabel) continue;

    const solutionStartPattern = new RegExp(
      `(?:^|\\n)\\s*${questionLabel}[\\s\\.\\)]+\\(?[A-Da-d0-9\\.]+\\)?`,
      'i'
    );

    const startMatch = rawContent.match(solutionStartPattern);
    if (!startMatch) continue;

    const startIndex = startMatch.index;

    const nextQuestionPattern = new RegExp(
      `\\n\\s*(${parseInt(questionLabel) + 1})\\s*[\\.\\)]`,
      'g'
    );
    nextQuestionPattern.lastIndex = startIndex + startMatch[0].length;

    let endIndex = rawContent.length;
    const nextMatch = nextQuestionPattern.exec(rawContent);
    if (nextMatch) {
      endIndex = nextMatch.index;
    }

    const solutionSection = rawContent.substring(startIndex, endIndex);
    const imageMatch = solutionSection.match(/!\[[^\]]*\]\(([^)]+)\)/);

    if (imageMatch && imageMatch[1]) {
      if (!solution.visual_path) {
        solution.visual_path = imageMatch[1];
      }

      const imageLineEnd = solutionSection.indexOf(imageMatch[0]) + imageMatch[0].length;
      const contentAfterImage = solutionSection.substring(imageLineEnd).trim();

      if (contentAfterImage) {
        const currentWorkedSolution = solution.worked_solution || '';
        const rawMathBlocks = (contentAfterImage.match(/\$\\begin\{(gathered|aligned|array)\}/g) || []).length;
        const currentMathBlocks = (currentWorkedSolution.match(/\$\\begin\{(gathered|aligned|array)\}/g) || []).length;

        if (!currentWorkedSolution.trim() || currentWorkedSolution.length < 100 || rawMathBlocks > currentMathBlocks) {
          let cleanedContent = contentAfterImage
            .split('\n')
            .filter(line => !line.trim().startsWith('!['))
            .join('\n')
            .trim();

          solution.worked_solution = cleanedContent;
        }
      }
    } else {
      const currentWorkedSolution = solution.worked_solution || '';

      const headerPattern = new RegExp(`^\\s*${questionLabel}[\\s\\.\\)]+\\(?[A-Da-d0-9\\.]+\\)?\\s*$`, 'i');
      const lines = solutionSection.split('\n');
      const contentLines = lines
        .filter(line => !headerPattern.test(line) && !line.trim().startsWith('![') && line.trim().length > 0)
        .join('\n')
        .trim();

      if (contentLines) {
        const rawMathBlocks = (contentLines.match(/\$\\begin\{(gathered|aligned|array)\}/g) || []).length;
        const currentMathBlocks = (currentWorkedSolution.match(/\$\\begin\{(gathered|aligned|array)\}/g) || []).length;

        if (!currentWorkedSolution.trim() || rawMathBlocks > currentMathBlocks) {
          solution.worked_solution = contentLines;
        }
      }
    }
  }
  return solutions;
}

function formatAllSolutionsLatex(solutions) {
  for (const solution of solutions) {
    if (solution.worked_solution) {
      solution.worked_solution = formatLatexBlocks(solution.worked_solution);
    }
  }
  return solutions;
}

// Normalize for comparison (remove extra spaces around operators)
function normalize(str) {
  return str
    .replace(/\s+/g, ' ')
    .replace(/\s*\\\\\s*/g, ' \\\\ ')
    .replace(/\s*=\s*/g, ' = ')
    .trim();
}

// Test solutions (simulating LlamaParse returning partial/empty content)
const testSolutions = [
  { question_label: '2', answer_key: 'A', worked_solution: '', explanation: '' },
  { question_label: '6', answer_key: 'D', worked_solution: '', explanation: '' },
  { question_label: '9', answer_key: 'C', worked_solution: '', explanation: '' },
  { question_label: '13', answer_key: 'D', worked_solution: '', explanation: '' },
  { question_label: '22', answer_key: '11.00', worked_solution: '$A ( 2,6,2 ) B ( - 4,0 , \\lambda ) , C ( 2,3 , - 1 ) D ( 4,5,0 )$', explanation: '' },
  { question_label: '30', answer_key: '1.00', worked_solution: '', explanation: '' },
];

// Run extraction
const extractedSolutions = extractVisualPaths(testSolutions, rawContent);
const result = formatAllSolutionsLatex(extractedSolutions);

// Compare results
console.log('='.repeat(70));
console.log('API MATCH TEST RESULTS');
console.log('='.repeat(70));

let allPassed = true;

for (const solution of result) {
  const label = solution.question_label;
  const expected = expectedSolutions[label];
  const actual = solution.worked_solution;

  if (!expected) continue;

  console.log(`\n--- SOLUTION ${label} ---`);

  // Check if they match (normalized)
  const normalizedExpected = normalize(expected);
  const normalizedActual = normalize(actual);

  if (normalizedExpected === normalizedActual) {
    console.log('✅ MATCH');
  } else {
    console.log('❌ MISMATCH');
    allPassed = false;
    console.log('\nEXPECTED:');
    console.log(JSON.stringify(expected));
    console.log('\nACTUAL:');
    console.log(JSON.stringify(actual));
  }

  // Show visual_path if present
  if (solution.visual_path) {
    console.log(`visual_path: ${solution.visual_path.substring(0, 50)}...`);
  }
}

console.log('\n' + '='.repeat(70));
if (allPassed) {
  console.log('✅ ALL TESTS PASSED - Output matches API exactly');
} else {
  console.log('❌ SOME TESTS FAILED - Check mismatches above');
}
console.log('='.repeat(70));
