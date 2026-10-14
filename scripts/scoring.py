"""Wilks and DOTS scoring formulas. Shared by percentile engine and progress model."""

def wilks(sex, bodyweight_kg, total_kg):
    if sex.upper().startswith('M'):
        c = [-216.0475144, 16.2606339, -0.002388645,
             -0.00113732, 7.01863e-06, -1.291e-08]
    else:
        c = [594.31747775582, -27.23842536447, 0.82112226871,
             -0.00930733913, 0.00004731582, -0.00000009054]
    denom = sum(coef * (bodyweight_kg ** i) for i, coef in enumerate(c))
    return (500.0 / denom) * total_kg


def dots(sex, bodyweight_kg, total_kg):
    if sex.upper().startswith('M'):
        c = [-307.75076, 24.0900756, -0.1918759221,
             0.0007391293, -0.000001093]
    else:
        c = [-57.96288, 13.6175032, -0.1126655495,
             0.0005158568, -0.0000010706]
    denom = sum(coef * (bodyweight_kg ** i) for i, coef in enumerate(c))
    return (500.0 / denom) * total_kg
