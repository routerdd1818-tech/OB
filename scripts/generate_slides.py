import sys
import os
from pptx import Presentation
from pptx.util import Inches, Pt
from pptx.dml.color import RGBColor
from pptx.enum.text import PP_ALIGN, MSO_ANCHOR
from pptx.enum.shapes import MSO_SHAPE

def build_presentation():
    prs = Presentation()
    prs.slide_width = Inches(13.333)
    prs.slide_height = Inches(7.5)
    blank_layout = prs.slide_layouts[6]

    # 色彩定義
    C_NAVY = RGBColor(15, 23, 42)       # #0f172a
    C_SLATE_DARK = RGBColor(30, 41, 59) # #1e293b
    C_SLATE_MID = RGBColor(71, 85, 105) # #475569
    C_SLATE_MUTED = RGBColor(100, 116, 139) # #64748b
    C_SLATE_LIGHT = RGBColor(241, 245, 249) # #f1f5f9
    C_WHITE = RGBColor(255, 255, 255)
    C_AMBER = RGBColor(217, 119, 6)     # #d97706
    C_AMBER_LIGHT = RGBColor(254, 243, 199) # #fef3c7
    C_BLUE = RGBColor(2, 132, 199)      # #0284c7
    C_BLUE_LIGHT = RGBColor(224, 242, 254)  # #e0f2fe
    C_GREEN = RGBColor(5, 150, 105)     # #059669
    C_GREEN_LIGHT = RGBColor(209, 250, 229) # #d1fae5
    C_RED = RGBColor(220, 38, 38)       # #dc2626
    C_RED_LIGHT = RGBColor(254, 226, 226)   # #fee2e2
    C_INDIGO = RGBColor(79, 70, 229)    # #4f46e5
    C_INDIGO_LIGHT = RGBColor(238, 242, 255)# #eef2ff
    C_LINE = RGBColor(226, 232, 240)    # #e2e8f0

    def set_bg(slide, color):
        bg = slide.shapes.add_shape(MSO_SHAPE.RECTANGLE, 0, 0, prs.slide_width, prs.slide_height)
        bg.fill.solid()
        bg.fill.fore_color.rgb = color
        bg.line.fill.background()
        return bg

    def add_header(slide, title, eyebrow=None, dark=False):
        top_offset = Inches(0.45)
        if eyebrow:
            box_e = slide.shapes.add_textbox(Inches(0.8), top_offset, Inches(11.7), Inches(0.35))
            tf_e = box_e.text_frame
            tf_e.word_wrap = True
            tf_e.margin_left = tf_e.margin_top = tf_e.margin_right = tf_e.margin_bottom = 0
            p_e = tf_e.paragraphs[0]
            p_e.text = eyebrow.upper()
            p_e.font.size = Pt(11)
            p_e.font.bold = True
            p_e.font.color.rgb = C_AMBER if dark else C_BLUE
            top_offset += Inches(0.3)

        box_t = slide.shapes.add_textbox(Inches(0.8), top_offset, Inches(11.7), Inches(0.65))
        tf_t = box_t.text_frame
        tf_t.word_wrap = True
        tf_t.margin_left = tf_t.margin_top = tf_t.margin_right = tf_t.margin_bottom = 0
        p_t = tf_t.paragraphs[0]
        p_t.text = title
        p_t.font.size = Pt(22)
        p_t.font.bold = True
        p_t.font.color.rgb = C_WHITE if dark else C_SLATE_DARK

    def add_card(slide, l, t, w, h, bg_color=C_WHITE, border_color=C_LINE):
        card = slide.shapes.add_shape(MSO_SHAPE.ROUNDED_RECTANGLE, l, t, w, h)
        card.fill.solid()
        card.fill.fore_color.rgb = bg_color
        if border_color:
            card.line.color.rgb = border_color
            card.line.width = Pt(1.5)
        else:
            card.line.fill.background()
        return card

    def add_notes(slide, text):
        slide.notes_slide.notes_text_frame.text = text

    def draw_quadrant(slide, l, t, size, target_x=None, target_y=None, highlight_zone=None):
        half = size / 2.0
        cells = [
            ("第二象限（左上）\n共識決策 × 平等主義\n【荷蘭 Polder / 北歐】", l, t, half, half, C_INDIGO_LIGHT if highlight_zone == 'Q2' else RGBColor(248, 250, 252)),
            ("第一象限（右上）\n共識決策 × 階層制\n【日本根回 / 稟議】", l + half, t, half, half, C_AMBER_LIGHT if highlight_zone == 'Q1' else RGBColor(248, 250, 252)),
            ("第三象限（左下）\n由上而下 × 平等主義\n【矽谷敏捷 / 小 d】", l, t + half, half, half, C_GREEN_LIGHT if highlight_zone == 'Q3' else RGBColor(248, 250, 252)),
            ("第四象限（右下）\n由上而下 × 階層制\n【中國/法國/導演模式】", l + half, t + half, half, half, C_BLUE_LIGHT if highlight_zone == 'Q4' else RGBColor(248, 250, 252)),
        ]
        for name, cl, ct, cw, ch, col in cells:
            shape = slide.shapes.add_shape(MSO_SHAPE.ROUNDED_RECTANGLE, cl, ct, cw, ch)
            shape.fill.solid()
            shape.fill.fore_color.rgb = col
            shape.line.color.rgb = C_LINE
            shape.line.width = Pt(1)
            tf = shape.text_frame
            tf.word_wrap = True
            tf.vertical_anchor = MSO_ANCHOR.MIDDLE
            tf.margin_left = tf.margin_right = Inches(0.1)
            p = tf.paragraphs[0]
            lines = name.split('\n')
            p.text = lines[0]
            p.font.size = Pt(11)
            p.font.bold = True
            p.font.color.rgb = C_SLATE_DARK
            p.alignment = PP_ALIGN.CENTER
            if len(lines) > 1:
                p2 = tf.add_paragraph()
                p2.text = lines[1]
                p2.font.size = Pt(10)
                p2.font.color.rgb = C_SLATE_MID
                p2.alignment = PP_ALIGN.CENTER
            if len(lines) > 2:
                p3 = tf.add_paragraph()
                p3.text = lines[2]
                p3.font.size = Pt(9.5)
                p3.font.color.rgb = C_AMBER if highlight_zone else C_SLATE_MUTED
                p3.alignment = PP_ALIGN.CENTER

        # 軸線標籤
        header_box = slide.shapes.add_textbox(l, t - Inches(0.35), size, Inches(0.3))
        htf = header_box.text_frame
        htf.margin_left = htf.margin_top = htf.margin_right = htf.margin_bottom = 0
        hp = htf.paragraphs[0]
        hp.text = "▲ 共識型決策 Consensual (Y: 100)"
        hp.font.size = Pt(9.5)
        hp.font.bold = True
        hp.font.color.rgb = C_BLUE
        hp.alignment = PP_ALIGN.CENTER

        footer_box = slide.shapes.add_textbox(l, t + size + Inches(0.05), size, Inches(0.3))
        ftf = footer_box.text_frame
        ftf.margin_left = ftf.margin_top = ftf.margin_right = ftf.margin_bottom = 0
        fp = ftf.paragraphs[0]
        fp.text = "◀ 平等主義 (X:0)   ▼ 由上而下 (Y:0)   階層制 (X:100) ▶"
        fp.font.size = Pt(9)
        fp.font.bold = True
        fp.font.color.rgb = C_SLATE_MUTED
        fp.alignment = PP_ALIGN.CENTER

        # 目標座標靶心
        if target_x is not None and target_y is not None:
            cx = l + (target_x / 100.0) * size
            cy = t + ((100.0 - target_y) / 100.0) * size
            r = Inches(0.28)
            pin = slide.shapes.add_shape(MSO_SHAPE.OVAL, cx - r/2, cy - r/2, r, r)
            pin.fill.solid()
            pin.fill.fore_color.rgb = C_RED
            pin.line.color.rgb = C_WHITE
            pin.line.width = Pt(2)

            tlabel = slide.shapes.add_textbox(cx - Inches(0.8), cy + Inches(0.18), Inches(1.6), Inches(0.35))
            ttf = tlabel.text_frame
            ttf.margin_left = ttf.margin_top = ttf.margin_right = ttf.margin_bottom = 0
            tp = ttf.paragraphs[0]
            tp.text = f"🎯 靶心 ({target_x}, {target_y})"
            tp.font.size = Pt(10)
            tp.font.bold = True
            tp.font.color.rgb = C_RED
            tp.alignment = PP_ALIGN.CENTER

    # =========================================================================
    # SLIDE 1: 封面 (Title Slide)
    # =========================================================================
    s1 = prs.slides.add_slide(blank_layout)
    set_bg(s1, C_NAVY)

    # 裝飾光暈卡
    add_card(s1, Inches(0.8), Inches(0.9), Inches(11.733), Inches(5.7), bg_color=C_SLATE_DARK, border_color=C_SLATE_MID)

    # 頂部標籤
    tag_box = s1.shapes.add_shape(MSO_SHAPE.ROUNDED_RECTANGLE, Inches(1.3), Inches(1.4), Inches(2.6), Inches(0.4))
    tag_box.fill.solid()
    tag_box.fill.fore_color.rgb = C_AMBER
    tag_box.line.fill.background()
    p = tag_box.text_frame.paragraphs[0]
    p.text = "WORKSHOP BACKUP DECK"
    p.font.size = Pt(11)
    p.font.bold = True
    p.font.color.rgb = C_NAVY
    p.alignment = PP_ALIGN.CENTER

    # 主標題
    title_box = s1.shapes.add_textbox(Inches(1.3), Inches(2.0), Inches(10.5), Inches(1.6))
    tf = title_box.text_frame
    tf.word_wrap = True
    p1 = tf.paragraphs[0]
    p1.text = "誰是文化王"
    p1.font.size = Pt(44)
    p1.font.bold = True
    p1.font.color.rgb = C_WHITE
    p2 = tf.add_paragraph()
    p2.text = "跨文化團隊決策與說服競技場 · 實體互動備案簡報"
    p2.font.size = Pt(22)
    p2.font.color.rgb = C_AMBER

    # 副標題與說明
    desc_box = s1.shapes.add_textbox(Inches(1.3), Inches(3.8), Inches(10.5), Inches(1.4))
    tf2 = desc_box.text_frame
    tf2.word_wrap = True
    p3 = tf2.paragraphs[0]
    p3.text = "WHO IS THE CULTURE KING · Cross-Cultural Decision & Persuasion Arena"
    p3.font.size = Pt(14)
    p3.font.bold = True
    p3.font.color.rgb = C_BLUE_LIGHT
    p4 = tf2.add_paragraph()
    p4.text = "當線上連線受限或學員離線時，本簡報提供 100% 完整的四象限盲測情境、實體便利貼插旗機制、歐幾里得距離計分法與 HBR 經典案例覆盤。"
    p4.font.size = Pt(13)
    p4.font.color.rgb = RGBColor(203, 213, 225)

    # 底部特色標籤列
    features = ["📍 2×2 決策象限盲測", "🎯 歐幾里得距離精準計分", "👑 跨立場說服王機制", "📚 HBR Linda Hill 領導矩陣"]
    for i, feat in enumerate(features):
        fb = s1.shapes.add_shape(MSO_SHAPE.ROUNDED_RECTANGLE, Inches(1.3 + i * 2.65), Inches(5.6), Inches(2.45), Inches(0.45))
        fb.fill.solid()
        fb.fill.fore_color.rgb = RGBColor(51, 65, 85)
        fb.line.color.rgb = C_SLATE_MID
        fp = fb.text_frame.paragraphs[0]
        fp.text = feat
        fp.font.size = Pt(11)
        fp.font.color.rgb = C_WHITE
        fp.alignment = PP_ALIGN.CENTER

    add_notes(s1, "【講師開場引言】\n歡迎大家來到《誰是文化王》。這是一場結合哈佛商業評論（HBR）《Being the Boss》三大要務與 Erin Meyer 跨文化領導矩陣的實戰競技。今天每一組都將化身跨國整合專案組，面對 4 場海外真實衝突，在 2×2 座標地圖上盲測落點，角逐全場文化王！")

    # =========================================================================
    # SLIDE 2: 理論基石 (Theoretical Foundations)
    # =========================================================================
    s2 = prs.slides.add_slide(blank_layout)
    set_bg(s2, C_SLATE_LIGHT)
    add_header(s2, "理論基石：跨文化決策的兩大核心維度", "THEORETICAL FOUNDATION")

    # 左右兩欄卡片
    col_w = Inches(5.65)
    card_h = Inches(4.3)
    c1 = add_card(s2, Inches(0.8), Inches(1.5), col_w, card_h)
    c2 = add_card(s2, Inches(6.88), Inches(1.5), col_w, card_h)

    # 卡片 1: X 軸
    tf1 = c1.text_frame
    tf1.word_wrap = True
    tf1.margin_left = tf1.margin_top = tf1.margin_right = Inches(0.3)
    p = tf1.paragraphs[0]
    p.text = "橫軸（X 軸）：權力距離維度"
    p.font.size = Pt(18)
    p.font.bold = True
    p.font.color.rgb = C_BLUE
    p_sub = tf1.add_paragraph()
    p_sub.text = "平等主義 (Egalitarian: 0) ↔ 階層制 (Hierarchical: 100)\n"
    p_sub.font.size = Pt(12)
    p_sub.font.color.rgb = C_SLATE_MUTED

    items_x = [
        ("平等主義（Low Power Distance / 0~35）", "組織結構極度扁平，員工習慣直呼主管名字。基層被賦予高度話語權，跨級直接溝通被視為高效與坦率，主管扮演「平等促進者」。"),
        ("階層制（High Power Distance / 65~100）", "重視組織序列與職級尊卑。溝通與決策嚴格遵循層級鏈條，越級報告被視為挑釁與失序。基層敬畏權威，主管具備明確指導權與最終責任。")
    ]
    for title, desc in items_x:
        pt = tf1.add_paragraph()
        pt.text = "• " + title
        pt.font.bold = True
        pt.font.size = Pt(13)
        pt.font.color.rgb = C_SLATE_DARK
        pd = tf1.add_paragraph()
        pd.text = desc + "\n"
        pd.font.size = Pt(11)
        pd.font.color.rgb = C_SLATE_MID

    # 卡片 2: Y 軸
    tf2 = c2.text_frame
    tf2.word_wrap = True
    tf2.margin_left = tf2.margin_top = tf2.margin_right = Inches(0.3)
    p = tf2.paragraphs[0]
    p.text = "縱軸（Y 軸）：決策方式維度"
    p.font.size = Pt(18)
    p.font.bold = True
    p.font.color.rgb = C_AMBER
    p_sub2 = tf2.add_paragraph()
    p_sub2.text = "由上而下速決 (Top-Down: 0) ↔ 全員共識決策 (Consensual: 100)\n"
    p_sub2.font.size = Pt(12)
    p_sub2.font.color.rgb = C_SLATE_MUTED

    items_y = [
        ("由上而下速決（Top-Down / 0~35）", "決策講求速度與效率。主管聽取意見後迅速拍板（小寫 d 模式）。決策被視為「動態里程碑」，隨時可依新數據敏捷微調（Hotfix）。"),
        ("全員共識決策（Consensual / 65~100）", "追求全員一致同意與深度承諾（大寫 D 模式）。前期花費大量時間會前溝通（根回 Nemawashi），一旦拍板如石碑不可輕易翻案。")
    ]
    for title, desc in items_y:
        pt = tf2.add_paragraph()
        pt.text = "• " + title
        pt.font.bold = True
        pt.font.size = Pt(13)
        pt.font.color.rgb = C_SLATE_DARK
        pd = tf2.add_paragraph()
        pd.text = desc + "\n"
        pd.font.size = Pt(11)
        pd.font.color.rgb = C_SLATE_MID

    # 底部總結金句盒
    add_card(s2, Inches(0.8), Inches(6.05), Inches(11.733), Inches(0.9), bg_color=C_NAVY, border_color=None)
    bottom_box = s2.shapes.add_textbox(Inches(1.0), Inches(6.15), Inches(11.333), Inches(0.7))
    btf = bottom_box.text_frame
    btf.word_wrap = True
    bp = btf.paragraphs[0]
    bp.text = "💡 跨文化領導的核心啟示：沒有放之四海皆準的領導風格。卓越管理者從不強求團隊改變文化 DNA，而是精準調整自己的決策座標！"
    bp.font.size = Pt(13)
    bp.font.bold = True
    bp.font.color.rgb = C_AMBER_LIGHT

    add_notes(s2, "【引導重點】\n向學員強調：X 軸是『權力與距離』，Y 軸是『速度與共識』。很多人常誤以為『平等＝一定會共識』或『階層＝一定由上而下』，但這恰恰是跨國管理最大的盲點！例如日本是『高階層 × 高共識』，而美國是『平等 × 由上而下』。")

    # =========================================================================
    # SLIDE 3: 2×2 決策象限圖解矩陣
    # =========================================================================
    s3 = prs.slides.add_slide(blank_layout)
    set_bg(s3, C_SLATE_LIGHT)
    add_header(s3, "2×2 決策矩陣：全球四大文化原型", "THE 2X2 CULTURAL MATRIX")

    matrix_w = Inches(5.5)
    matrix_h = Inches(4.8)
    draw_quadrant(s3, Inches(0.8), Inches(1.7), matrix_h)

    # 右側四大原型解析
    right_w = Inches(6.0)
    cards_info = [
        ("第一象限（右上）：共識型決策 × 階層制", "【日本、韓國】嚴明職級尊重與全員共識並存。正式會議僅為形式用印，真正的決策必須在會前依職級序列由下而上完成「根回（Nemawashi）」。", C_AMBER_LIGHT, C_AMBER),
        ("第二象限（左上）：共識型決策 × 平等主義", "【荷蘭、北歐各國】基層與主管平起平坐，人人皆有一票否決權。領導者為「促進者」，追求刻在石碑上的神聖大承諾（大 D）。", C_INDIGO_LIGHT, C_INDIGO),
        ("第三象限（左下）：由上而下速決 × 平等主義", "【美國矽谷、英國新創】扁平極客文化，鼓勵直抒己見甚至挑戰主管；但決策採「小 d」敏捷速決，先試跑、後續動態修補（Hotfix）。", C_GREEN_LIGHT, C_GREEN),
        ("第四象限（右下）：由上而下速決 × 階層制", "【中國量產基地、法國、印度】強調最高主管威權指揮（Director 模式）。危機時刻基層渴望明確指令，領導者必須一肩扛起成敗責任。", C_BLUE_LIGHT, C_BLUE),
    ]

    for i, (title, text, bg, border) in enumerate(cards_info):
        card = add_card(s3, Inches(6.5), Inches(1.55 + i * 1.3), right_w, Inches(1.18), bg_color=bg, border_color=border)
        ctf = card.text_frame
        ctf.word_wrap = True
        ctf.margin_left = ctf.margin_top = ctf.margin_right = Inches(0.18)
        p = ctf.paragraphs[0]
        p.text = title
        p.font.size = Pt(12)
        p.font.bold = True
        p.font.color.rgb = C_SLATE_DARK
        p2 = ctf.add_paragraph()
        p2.text = text
        p2.font.size = Pt(10)
        p2.font.color.rgb = C_SLATE_MID

    add_notes(s3, "【象限圖解說明】\n請引導學員注意這張圖的四個角落。接下來的 4 個實戰案例，將會平均分散在這 4 個象限中。各組需要仔細觀察案例中的線索，判斷該情境究竟屬於哪一個象限！")

    # =========================================================================
    # SLIDE 4: 實體備案遊戲規則與計分公式
    # =========================================================================
    s4 = prs.slides.add_slide(blank_layout)
    set_bg(s4, C_SLATE_LIGHT)
    add_header(s4, "實體備案遊戲規則與歐幾里得距離計分法", "RULES & EUCLIDEAN SCORING")

    # 3 個流程步驟卡片
    step_w = Inches(3.68)
    step_h = Inches(3.2)
    steps = [
        ("階段一 · 盲測落點", "閱讀衝突現場與對白\n小組研討 3 分鐘\n在白紙或象限圖上標出\n本組決策座標 (X, Y)\n(0~100 數值)", C_BLUE, "⏱️ 研討限時 3 分鐘"),
        ("階段二 · 說服辯論", "各組輪流派出代表發言\n可運用 3 點說服點數\n投票給最有說服力的組別\n👑 當選「說服王」的組別\n若初選踩雷全班承受懲罰！", C_AMBER, "⚖️ 說服點數分配"),
        ("階段三 · 揭曉計分", "講師公布真實靶心座標\n計算本組與靶心的誤差距離\n離靶心越近得分越高\n四輪累計文化總積分\n加冕全場「文化王」！", C_GREEN, "🎯 歐幾里得距離結算")
    ]

    for i, (stitle, sdesc, col, badge) in enumerate(steps):
        sc = add_card(s4, Inches(0.8 + i * 4.02), Inches(1.5), step_w, step_h)
        stf = sc.text_frame
        stf.word_wrap = True
        stf.margin_left = stf.margin_top = stf.margin_right = Inches(0.25)
        p = stf.paragraphs[0]
        p.text = stitle
        p.font.size = Pt(16)
        p.font.bold = True
        p.font.color.rgb = col
        p_badge = stf.add_paragraph()
        p_badge.text = badge + "\n"
        p_badge.font.size = Pt(11)
        p_badge.font.color.rgb = C_SLATE_MUTED

        for line in sdesc.split('\n'):
            pl = stf.add_paragraph()
            pl.text = "• " + line
            pl.font.size = Pt(11.5)
            pl.font.color.rgb = C_SLATE_DARK

    # 底部計分公式盒
    score_card = add_card(s4, Inches(0.8), Inches(4.95), Inches(11.733), Inches(2.0), bg_color=C_NAVY, border_color=None)
    stf2 = score_card.text_frame
    stf2.word_wrap = True
    stf2.margin_left = stf2.margin_top = stf2.margin_right = Inches(0.3)
    p = stf2.paragraphs[0]
    p.text = "📐 歐幾里得距離（Euclidean Distance）計分機制"
    p.font.size = Pt(16)
    p.font.bold = True
    p.font.color.rgb = C_AMBER

    p_f = stf2.add_paragraph()
    p_f.text = "誤差距離 d = √[ (X_guess - X_target)² + (Y_guess - Y_target)² ]   ｜   本輪得分 = Max(0, 100 - d)"
    p_f.font.size = Pt(14)
    p_f.font.bold = True
    p_f.font.color.rgb = C_WHITE

    p_tiers = stf2.add_paragraph()
    p_tiers.text = "• 🎯 完美命中（d ≤ 15 格）：精準切中該文化核心！得分 85 ~ 100 分\n• 🟢 精準落點（15 < d ≤ 30 格）：落入正確象限核心區！得分 70 ~ 85 分\n• 🟡 方向尚可（30 < d ≤ 50 格）：掌握大方向但力道有偏差，得分 50 ~ 70 分\n• 🔴 嚴重偏離（d > 50 格）：落入完全相反象限，引發跨文化衝突危機！得分低於 50 分"
    p_tiers.font.size = Pt(11)
    p_tiers.font.color.rgb = RGBColor(226, 232, 240)

    add_notes(s4, "【實體操作指引】\n請發給每組一張白紙，請每組畫出 2×2 十字軸，標記 0~100。每題討論結束後，請各組隊長在紙上寫下他們決定的 (X, Y) 座標並高舉亮出！")

    # =========================================================================
    # SLIDE 5: CASE 01 題目情境 (Round 1 Scenario)
    # =========================================================================
    s5 = prs.slides.add_slide(blank_layout)
    set_bg(s5, C_SLATE_LIGHT)
    add_header(s5, "CASE 01 · 沉默的正式會議與消失的測試數據", "ROUND 1 · SCENARIO CHALLENGE")

    # 左側情境卡片
    left_c = add_card(s5, Inches(0.8), Inches(1.5), Inches(6.8), Inches(4.3))
    ltf = left_c.text_frame
    ltf.word_wrap = True
    ltf.margin_left = ltf.margin_top = ltf.margin_right = Inches(0.3)
    p = ltf.paragraphs[0]
    p.text = "📍 地點：海外併購 · Alpha 精密研發中心"
    p.font.size = Pt(14)
    p.font.bold = True
    p.font.color.rgb = C_AMBER

    sc_text = (
        "【衝突現場】\n"
        "併購 Alpha 晶圓封裝廠的第三週，你在週一全體正式會議上提出「縮短高溫老練測試 20% 工時」的新方案。\n\n"
        "會議中你詢問現場主管有無異議，在場 12 位當地主管與資深技師全數低頭抄筆記，資深總工僅微笑點頭說：「我們會盡力研究。」\n\n"
        "然而到了週三早上，產線一動也沒動；同時你經過茶水間時，聽見資深總工正嚴厲斥責一位昨晚直接寫信給你提供修改建議的年輕工程師「不懂規矩、破壞團隊程序」。"
    )
    for block in sc_text.split('\n\n'):
        pb = ltf.add_paragraph()
        pb.text = block
        pb.font.size = Pt(12)
        pb.font.color.rgb = C_SLATE_DARK

    # 右側對白盒
    right_c = add_card(s5, Inches(7.8), Inches(1.5), Inches(4.733), Inches(4.3), bg_color=C_WHITE, border_color=C_BLUE)
    rtf = right_c.text_frame
    rtf.word_wrap = True
    rtf.margin_left = rtf.margin_top = rtf.margin_right = Inches(0.25)
    p = rtf.paragraphs[0]
    p.text = "🎙️ 雙方真實對白錄音"
    p.font.size = Pt(14)
    p.font.bold = True
    p.font.color.rgb = C_BLUE

    dialogues = [
        ("矽谷主管", "「距離發表會只剩三週，我們需要明確承諾。下週五能交出縮減工時的晶圓嗎？」"),
        ("東京高橋總工", "「我們明白事情的重要性……但目前製程參數，內部可能還需要再研究一下。」"),
        ("年輕工程師私下私訊", "「其實只要微調熱膨脹參數即可縮減工時，但總工交代在正式稟議通過前，誰都不能直接改。」")
    ]
    for who, text in dialogues:
        pw = rtf.add_paragraph()
        pw.text = "• " + who
        pw.font.bold = True
        pw.font.size = Pt(11)
        pw.font.color.rgb = C_SLATE_DARK
        pt = rtf.add_paragraph()
        pt.text = text + "\n"
        pt.font.size = Pt(10.5)
        pt.font.color.rgb = C_SLATE_MID

    # 底部任務橫幅
    banner = add_card(s5, Inches(0.8), Inches(6.0), Inches(11.733), Inches(0.95), bg_color=C_NAVY, border_color=None)
    btf = banner.text_frame
    btf.word_wrap = True
    bp = btf.paragraphs[0]
    bp.text = "⏱️ 小組任務（倒數 3 分鐘）：請根據組織行為線索判斷對方文化類型，並在四象限中釘出你們這組的決策座標 (X, Y)！"
    bp.font.size = Pt(13)
    bp.font.bold = True
    bp.font.color.rgb = C_AMBER_LIGHT

    add_notes(s5, "【討論引導提示】\n請引導學員注意兩大線索：\n1. 為什麼總工在會上不反對，會後卻完全不動？\n2. 為什麼總工要嚴懲直接寫信給你的年輕工程師？這反映了什麼樣的權力距離與決策程序？")

    # =========================================================================
    # SLIDE 6: CASE 01 答案揭曉與解析 (Round 1 Reveal & Analysis)
    # =========================================================================
    s6 = prs.slides.add_slide(blank_layout)
    set_bg(s6, C_SLATE_LIGHT)
    add_header(s6, "CASE 01 答案揭曉 · 第一象限（右上：X=78, Y=82）", "ROUND 1 · VERDICT & HBR DEEP DIVE")

    draw_quadrant(s6, Inches(0.8), Inches(1.7), Inches(4.8), target_x=78, target_y=82, highlight_zone='Q1')

    # 右側深度解析卡片
    rc = add_card(s6, Inches(6.0), Inches(1.5), Inches(6.533), Inches(5.4))
    rtf = rc.text_frame
    rtf.word_wrap = True
    rtf.margin_left = rtf.margin_top = rtf.margin_right = Inches(0.3)
    p = rtf.paragraphs[0]
    p.text = "🎯 真實最佳座標：第一象限（右上 X:78, Y:82）"
    p.font.size = Pt(16)
    p.font.bold = True
    p.font.color.rgb = C_AMBER

    pv = rtf.add_paragraph()
    pv.text = "判定特質：高權力距離（階層制）× 高共識校準（Consensual）\n"
    pv.font.size = Pt(12)
    pv.font.bold = True
    pv.font.color.rgb = C_SLATE_DARK

    analyses = [
        ("文獻理論原型：日本 Nemawashi 根回與稟議制", "依據 HBR 跨文化領導矩陣，此組織兼具「嚴明的職級尊卑（高 X: 78）」與「全員共識決策（高 Y: 82）」。資深總工嚴斥越級報告者，體現了對既有職級階層秩序的嚴格維護。"),
        ("常見管理盲點覆盤", "在該文化中，正式大會不是「辯論場所」，而僅是各方私下達成協議後的「最終蓋章用印儀式」。如果會前沒有經過各部門幹部的非正式私下對齊（根回），任何新提案在大會上都不會得到實質執行。"),
        ("卓越領導者的因地制宜行動", "切忌在大會上強推多數決或由上而下施壓！正確作法是先透過資深總工，在會前由下而上與各課長私下摸底、分擔驗證，待全員完成稟議背書後再召開正式會議。")
    ]
    for head, body in analyses:
        ph = rtf.add_paragraph()
        ph.text = "• " + head
        ph.font.bold = True
        ph.font.size = Pt(11.5)
        ph.font.color.rgb = C_SLATE_DARK
        pb = rtf.add_paragraph()
        pb.text = body + "\n"
        pb.font.size = Pt(10)
        pb.font.color.rgb = C_SLATE_MID

    add_notes(s6, "【計分與覆盤引導】\n靶心座標為 (78, 82)。請各組計算本組座標與 (78, 82) 的距離 d = √[(X-78)² + (Y-82)²]，得分為 100 - d！\n重點詢問：哪些組別誤判落入左側（平等主義）或下方（由上而下）？為什麼會產生這種誤判？")

    # =========================================================================
    # SLIDE 7: CASE 02 題目情境 (Round 2 Scenario)
    # =========================================================================
    s7 = prs.slides.add_slide(blank_layout)
    set_bg(s7, C_SLATE_LIGHT)
    add_header(s7, "CASE 02 · 良率暴跌夜的群組風暴", "ROUND 2 · SCENARIO CHALLENGE")

    left_c = add_card(s7, Inches(0.8), Inches(1.5), Inches(6.8), Inches(4.3))
    ltf = left_c.text_frame
    ltf.word_wrap = True
    ltf.margin_left = ltf.margin_top = ltf.margin_right = Inches(0.3)
    p = ltf.paragraphs[0]
    p.text = "📍 地點：海外量產 · Beta 核心試產基地"
    p.font.size = Pt(14)
    p.font.bold = True
    p.font.color.rgb = C_BLUE

    sc_text2 = (
        "【衝突現場】\n"
        "Beta 廠夜班試產發生塗佈異常，良率瞬間暴跌至 48%。資深廠長主張立刻停線洗機，但試產組幾位工程師在工作群組裡激烈爭辯，雙方互相指責誰該為交貨延誤負全責。\n\n"
        "產線領班站在機台旁不知所措，私訊問你：「現在到底該聽誰的？請給我們一個明確的裁示，否則沒人敢動手！」\n\n"
        "距離向波士頓總部與全球大客戶交貨僅剩最後 4 小時，產線每停擺 10 分鐘，公司就面臨巨額違約罰金。"
    )
    for block in sc_text2.split('\n\n'):
        pb = ltf.add_paragraph()
        pb.text = block
        pb.font.size = Pt(12)
        pb.font.color.rgb = C_SLATE_DARK

    right_c = add_card(s7, Inches(7.8), Inches(1.5), Inches(4.733), Inches(4.3), bg_color=C_WHITE, border_color=C_RED)
    rtf = right_c.text_frame
    rtf.word_wrap = True
    rtf.margin_left = rtf.margin_top = rtf.margin_right = Inches(0.25)
    p = rtf.paragraphs[0]
    p.text = "🎙️ 現場真實對白錄音"
    p.font.size = Pt(14)
    p.font.bold = True
    p.font.color.rgb = C_RED

    dialogues2 = [
        ("產線領班私訊", "「廠長跟試產組工程師各執一詞，沒人敢承擔停機責任！請主管直接下指令，否則現場沒人敢動！」"),
        ("爭執工程師群組", "「這明明是配方問題，憑什麼叫我們試產組背黑鍋？萬一停線交不出貨誰負責？」"),
        ("資深廠長", "「我是現場負責人，但上面沒有白紙黑字明確授權，我不能擅自停線承擔產能損失。」")
    ]
    for who, text in dialogues2:
        pw = rtf.add_paragraph()
        pw.text = "• " + who
        pw.font.bold = True
        pw.font.size = Pt(11)
        pw.font.color.rgb = C_SLATE_DARK
        pt = rtf.add_paragraph()
        pt.text = text + "\n"
        pt.font.size = Pt(10.5)
        pt.font.color.rgb = C_SLATE_MID

    banner = add_card(s7, Inches(0.8), Inches(6.0), Inches(11.733), Inches(0.95), bg_color=C_NAVY, border_color=None)
    btf = banner.text_frame
    btf.word_wrap = True
    bp = btf.paragraphs[0]
    bp.text = "⏱️ 小組任務（倒數 3 分鐘）：面對倒數 4 小時的交貨危機與團隊對權責歸屬的焦慮，你們這組的決策座標應落在哪裡？"
    bp.font.size = Pt(13)
    bp.font.bold = True
    bp.font.color.rgb = C_AMBER_LIGHT

    add_notes(s7, "【討論引導提示】\n請引導學員思考：為什麼大家都在爭吵『誰該負全責』？為什麼領班說『沒明確裁示沒人敢動手』？此時如果要求大家坐下來開會凝聚共識，會發生什麼事？")

    # =========================================================================
    # SLIDE 8: CASE 02 答案揭曉與解析 (Round 2 Reveal & Analysis)
    # =========================================================================
    s8 = prs.slides.add_slide(blank_layout)
    set_bg(s8, C_SLATE_LIGHT)
    add_header(s8, "CASE 02 答案揭曉 · 第四象限（右下：X=84, Y=18）", "ROUND 2 · VERDICT & HBR DEEP DIVE")

    draw_quadrant(s8, Inches(0.8), Inches(1.7), Inches(4.8), target_x=84, target_y=18, highlight_zone='Q4')

    rc = add_card(s8, Inches(6.0), Inches(1.5), Inches(6.533), Inches(5.4))
    rtf = rc.text_frame
    rtf.word_wrap = True
    rtf.margin_left = rtf.margin_top = rtf.margin_right = Inches(0.3)
    p = rtf.paragraphs[0]
    p.text = "🎯 真實最佳座標：第四象限（右下 X:84, Y:18）"
    p.font.size = Pt(16)
    p.font.bold = True
    p.font.color.rgb = C_BLUE

    pv = rtf.add_paragraph()
    pv.text = "判定特質：高權力距離（階層制）× 由上而下速決（Top-Down Director 模式）\n"
    pv.font.size = Pt(12)
    pv.font.bold = True
    pv.font.color.rgb = C_SLATE_DARK

    analyses2 = [
        ("文獻理論原型：Director 指揮官／導演模式", "依據 HBR 跨文化矩陣，此情境屬於第四象限（高階層制 X: 84 × 由上而下速決 Y: 18，文獻原型如中國、法國、印度企業）。基層在危機中極度需要明確職權劃分與指令，由最高管理者承擔最終風險。"),
        ("常見管理盲點覆盤", "許多受西方管理訓練的主管在此時會試圖「召開全員民主討論凝聚共識」，但在該文化視角下，這種行為會被解讀為「主管軟弱、毫無擔當、企圖找基層墊背」。"),
        ("卓越領導者的因地制宜行動", "迅速聽取雙方關鍵數據，果斷做出明確裁示（Director 模式），下達清晰步驟並向全場宣告：「責任由我全權承擔，全體按指引執行！」軍心才能瞬間穩定。")
    ]
    for head, body in analyses2:
        ph = rtf.add_paragraph()
        ph.text = "• " + head
        ph.font.bold = True
        ph.font.size = Pt(11.5)
        ph.font.color.rgb = C_SLATE_DARK
        pb = rtf.add_paragraph()
        pb.text = body + "\n"
        pb.font.size = Pt(10)
        pb.font.color.rgb = C_SLATE_MID

    add_notes(s8, "【計分與覆盤引導】\n靶心座標為 (84, 18)。請各組計算與靶心的歐幾里得距離！\n提問：哪些組別在第二輪誤選了共識決策（Y > 50）？在交期剩 4 小時的工廠危機中，為什麼尋求全員共識反而是災難？")

    # =========================================================================
    # SLIDE 9: CASE 03 題目情境 (Round 3 Scenario)
    # =========================================================================
    s9 = prs.slides.add_slide(blank_layout)
    set_bg(s9, C_SLATE_LIGHT)
    add_header(s9, "CASE 03 · 被工程師直接推翻的封版時程", "ROUND 3 · SCENARIO CHALLENGE")

    left_c = add_card(s9, Inches(0.8), Inches(1.5), Inches(6.8), Inches(4.3))
    ltf = left_c.text_frame
    ltf.word_wrap = True
    ltf.margin_left = ltf.margin_top = ltf.margin_right = Inches(0.3)
    p = ltf.paragraphs[0]
    p.text = "📍 地點：新創研發 · Gamma 高速運算實驗室"
    p.font.size = Pt(14)
    p.font.bold = True
    p.font.color.rgb = C_GREEN

    sc_text3 = (
        "【衝突現場】\n"
        "距離雲端晶片韌體封版只剩 36 小時。Gamma 實驗室的一名年輕核心工程師在站立會議（Stand-up Meeting）上直接對你說：\n\n"
        "「你昨天定的架構太保守了！我昨晚自己寫了一個新演算法原型，雖然還有 15% 邊界條件沒測完，但效能可以提升兩倍！我們現在就先推上線試跑，有問題明天再動態修補（Hotfix）！」\n\n"
        "在場其他成員紛紛附和說值得賭一把，但品保主管則看向你等待定奪。團隊崇尚敏捷與快速試錯，但也面臨品質穩定性的巨大未知數。"
    )
    for block in sc_text3.split('\n\n'):
        pb = ltf.add_paragraph()
        pb.text = block
        pb.font.size = Pt(12)
        pb.font.color.rgb = C_SLATE_DARK

    right_c = add_card(s9, Inches(7.8), Inches(1.5), Inches(4.733), Inches(4.3), bg_color=C_WHITE, border_color=C_GREEN)
    rtf = right_c.text_frame
    rtf.word_wrap = True
    rtf.margin_left = rtf.margin_top = rtf.margin_right = Inches(0.25)
    p = rtf.paragraphs[0]
    p.text = "🎙️ 現場真實對白錄音"
    p.font.size = Pt(14)
    p.font.bold = True
    p.font.color.rgb = C_GREEN

    dialogues3 = [
        ("年輕工程師", "「守舊架構只會讓我們落後競品。先上了再說，明天真有 Bug 我通宵 Hotfix！」"),
        ("品保主管", "「還有 15% 邊界測試沒跑完，直接上線有風險，但這確實是我們團隊一貫的極客試錯作風……」"),
        ("團隊其他工程師", "「我同意，在矽谷速度大於完美，等跑完所有測試市場早就被搶走了！」")
    ]
    for who, text in dialogues3:
        pw = rtf.add_paragraph()
        pw.text = "• " + who
        pw.font.bold = True
        pw.font.size = Pt(11)
        pw.font.color.rgb = C_SLATE_DARK
        pt = rtf.add_paragraph()
        pt.text = text + "\n"
        pt.font.size = Pt(10.5)
        pt.font.color.rgb = C_SLATE_MID

    banner = add_card(s9, Inches(0.8), Inches(6.0), Inches(11.733), Inches(0.95), bg_color=C_NAVY, border_color=None)
    btf = banner.text_frame
    btf.word_wrap = True
    bp = btf.paragraphs[0]
    bp.text = "⏱️ 小組任務（倒數 3 分鐘）：面對扁平直接、崇尚快速試錯的團隊文化，你們這組的決策座標應釘在哪裡？"
    bp.font.size = Pt(13)
    bp.font.bold = True
    bp.font.color.rgb = C_AMBER_LIGHT

    add_notes(s9, "【討論引導提示】\n請引導學員注意：\n1. 年輕工程師敢直接當眾推翻主管，權力距離是高還是低？\n2. 團隊崇尚『先上線、有問題再動態修正（小 d）』，這究竟是由上而下敏捷決策，還是全員耗時大共識？")

    # =========================================================================
    # SLIDE 10: CASE 03 答案揭曉與解析 (Round 3 Reveal & Analysis)
    # =========================================================================
    s10 = prs.slides.add_slide(blank_layout)
    set_bg(s10, C_SLATE_LIGHT)
    add_header(s10, "CASE 03 答案揭曉 · 第三象限（左下：X=22, Y=24）", "ROUND 3 · VERDICT & HBR DEEP DIVE")

    draw_quadrant(s10, Inches(0.8), Inches(1.7), Inches(4.8), target_x=22, target_y=24, highlight_zone='Q3')

    rc = add_card(s10, Inches(6.0), Inches(1.5), Inches(6.533), Inches(5.4))
    rtf = rc.text_frame
    rtf.word_wrap = True
    rtf.margin_left = rtf.margin_top = rtf.margin_right = Inches(0.3)
    p = rtf.paragraphs[0]
    p.text = "🎯 真實最佳座標：第三象限（左下 X:22, Y:24）"
    p.font.size = Pt(16)
    p.font.bold = True
    p.font.color.rgb = C_GREEN

    pv = rtf.add_paragraph()
    pv.text = "判定特質：低權力距離（平等主義）× 由上而下敏捷速決（小 d 模式）\n"
    pv.font.size = Pt(12)
    pv.font.bold = True
    pv.font.color.rgb = C_SLATE_DARK

    analyses3 = [
        ("文獻理論原型：美國矽谷與英國團隊的「小 d」模式", "組織展現典型第三象限特質（低權力距離 X: 22 × 由上而下速決 Y: 24）。年輕人敢當面挑戰主管反映極低權力距離；而習慣先上線事後修正正是文獻定義的「小寫 d（little-d）」決策。"),
        ("常見管理盲點覆盤", "亞洲或歐陸主管容易誤以為「大家都贊成＝要尋求 100% 共識」，因而召開跨日馬拉松會議。但在矽谷敏捷文化中，速度重於完美，過度尋求共識會被視為官僚且缺乏魄力。"),
        ("卓越領導者的因地制宜行動", "鼓勵成員平等暢所欲言，肯定創新熱情；但領導者應迅速拍板明確規則（如先採用 10% 灰度發布或沙盒測試），保留敏捷 Hotfix 彈性，迅速推進！")
    ]
    for head, body in analyses3:
        ph = rtf.add_paragraph()
        ph.text = "• " + head
        ph.font.bold = True
        ph.font.size = Pt(11.5)
        ph.font.color.rgb = C_SLATE_DARK
        pb = rtf.add_paragraph()
        pb.text = body + "\n"
        pb.font.size = Pt(10)
        pb.font.color.rgb = C_SLATE_MID

    add_notes(s10, "【計分與覆盤引導】\n靶心座標為 (22, 24)。請各組計算歐幾里得距離！\n提問：哪些組別誤判為第二象限（共識決策）？引導學員理解『小 d（小寫 decision）』在矽谷敏捷文化中的真正含義。")

    # =========================================================================
    # SLIDE 11: CASE 04 題目情境 (Round 4 Scenario)
    # =========================================================================
    s11 = prs.slides.add_slide(blank_layout)
    set_bg(s11, C_SLATE_LIGHT)
    add_header(s11, "CASE 04 · 首發登台前兩小時的極限攤牌", "ROUND 4 · SCENARIO CHALLENGE")

    left_c = add_card(s11, Inches(0.8), Inches(1.5), Inches(6.8), Inches(4.3))
    ltf = left_c.text_frame
    ltf.word_wrap = True
    ltf.margin_left = ltf.margin_top = ltf.margin_right = Inches(0.3)
    p = ltf.paragraphs[0]
    p.text = "📍 地點：全球首發 · Delta 戰略客戶攤牌現場"
    p.font.size = Pt(14)
    p.font.bold = True
    p.font.color.rgb = C_INDIGO

    sc_text4 = (
        "【衝突現場】\n"
        "全球發表會倒數最後兩小時，最大戰略客戶端技術長帶著兩名年輕的基層測試員走進後台休息室，將一份「極端低溫訊號衰減報告」放在桌上。\n\n"
        "客戶方年輕的基層測試員直接直視你說：「在我們的團隊裡，每位技術人員都有權為安全把關。我們不在乎你的職銜高低或商業賠償金，這份數據如果不由雙方所有工程師坐下來公開透明共同審核並達成一致協議，我們不會簽署放行。」\n\n"
        "後台總部高層催促立刻強硬反擊，但客戶技術長表示自己無權違背測試團隊的專業否決權。"
    )
    for block in sc_text4.split('\n\n'):
        pb = ltf.add_paragraph()
        pb.text = block
        pb.font.size = Pt(12)
        pb.font.color.rgb = C_SLATE_DARK

    right_c = add_card(s11, Inches(7.8), Inches(1.5), Inches(4.733), Inches(4.3), bg_color=C_WHITE, border_color=C_INDIGO)
    rtf = right_c.text_frame
    rtf.word_wrap = True
    rtf.margin_left = rtf.margin_top = rtf.margin_right = Inches(0.25)
    p = rtf.paragraphs[0]
    p.text = "🎙️ 現場真實對白錄音"
    p.font.size = Pt(14)
    p.font.bold = True
    p.font.color.rgb = C_INDIGO

    dialogues4 = [
        ("客戶基層測試員", "「沒有經得起檢驗的品質承諾與全員透明共審，誰敢為發表會背書？任何私下妥協我們一概不認！」"),
        ("客戶技術長", "「在我們國家，技術長的職稱不能壓過數據與基層專業。我必須尊重他們的否決權。」"),
        ("總部高層私訊", "「市場開盤在即，能不能給他們主管商業折扣讓他們先簽字放行？」")
    ]
    for who, text in dialogues4:
        pw = rtf.add_paragraph()
        pw.text = "• " + who
        pw.font.bold = True
        pw.font.size = Pt(11)
        pw.font.color.rgb = C_SLATE_DARK
        pt = rtf.add_paragraph()
        pt.text = text + "\n"
        pt.font.size = Pt(10.5)
        pt.font.color.rgb = C_SLATE_MID

    banner = add_card(s11, Inches(0.8), Inches(6.0), Inches(11.733), Inches(0.95), bg_color=C_NAVY, border_color=None)
    btf = banner.text_frame
    btf.word_wrap = True
    bp = btf.paragraphs[0]
    bp.text = "⏱️ 小組任務（倒數 3 分鐘）：面對基層專業人員擁有絕對否決權、堅持全員透明共審的團隊，領導座標應落在哪裡？"
    bp.font.size = Pt(13)
    bp.font.bold = True
    bp.font.color.rgb = C_AMBER_LIGHT

    add_notes(s11, "【討論引導提示】\n請引導學員注意：\n1. 為什麼技術長不能強行下令放行？\n2. 商業折扣或高層密室協商在此文化中有用嗎？為什麼？")

    # =========================================================================
    # SLIDE 12: CASE 04 答案揭曉與解析 (Round 4 Reveal & Analysis)
    # =========================================================================
    s12 = prs.slides.add_slide(blank_layout)
    set_bg(s12, C_SLATE_LIGHT)
    add_header(s12, "CASE 04 答案揭曉 · 第二象限（左上：X=18, Y=85）", "ROUND 4 · VERDICT & HBR DEEP DIVE")

    draw_quadrant(s12, Inches(0.8), Inches(1.7), Inches(4.8), target_x=18, target_y=85, highlight_zone='Q2')

    rc = add_card(s12, Inches(6.0), Inches(1.5), Inches(6.533), Inches(5.4))
    rtf = rc.text_frame
    rtf.word_wrap = True
    rtf.margin_left = rtf.margin_top = rtf.margin_right = Inches(0.3)
    p = rtf.paragraphs[0]
    p.text = "🎯 真實最佳座標：第二象限（左上 X:18, Y:85）"
    p.font.size = Pt(16)
    p.font.bold = True
    p.font.color.rgb = C_INDIGO

    pv = rtf.add_paragraph()
    pv.text = "判定特質：極低權力距離（平等主義）× 全員透明共識（Consensual 大 D）\n"
    pv.font.size = Pt(12)
    pv.font.bold = True
    pv.font.color.rgb = C_SLATE_DARK

    analyses4 = [
        ("文獻理論原型：荷蘭 Polder Model 與北歐促進者模式", "情境屬於典型第二象限（極低權力距離 X: 18 × 高度共識導向 Y: 85）。基層工程師擁有一票否決權，職位頭銜無特權；堅持全員公開透明審查達成一致，體現神聖「大寫 D」共識承諾。"),
        ("常見管理盲點覆盤", "傳統主管常試圖「私下搞定對方高層」或「用商業折扣收買」，在北歐或荷蘭文化中，這被視為對專業誠信的嚴重侮辱，會立刻引發信任崩盤。"),
        ("卓越領導者的因地制宜行動", "主管必須轉化為「促進者（Facilitator）」，讓雙方工程師平起平坐、攤開數據共同制定方案（例如首波常溫批次交付＋低溫三方共審），以透明共識達成大 D 簽字！")
    ]
    for head, body in analyses4:
        ph = rtf.add_paragraph()
        ph.text = "• " + head
        ph.font.bold = True
        ph.font.size = Pt(11.5)
        ph.font.color.rgb = C_SLATE_DARK
        pb = rtf.add_paragraph()
        pb.text = body + "\n"
        pb.font.size = Pt(10)
        pb.font.color.rgb = C_SLATE_MID

    add_notes(s12, "【計分與覆盤引導】\n靶心座標為 (18, 85)。至此四回合已全部揭曉！\n請各組加總四輪總積分，算出一至四回合的累積總得分！")

    # =========================================================================
    # SLIDE 13: 跨文化決策全景對照表
    # =========================================================================
    s13 = prs.slides.add_slide(blank_layout)
    set_bg(s13, C_SLATE_LIGHT)
    add_header(s13, "跨文化決策全景：四大象限策略對照矩陣", "THE COMPLETE CULTURAL SPECTRUM")

    # 4 欄直式對照卡
    col_w = Inches(2.78)
    col_h = Inches(5.3)
    quadrants_summary = [
        ("第一象限（右上）", "階層制 × 共識型決策", "【日本、韓國】\n• 決策機制：根回與稟議制\n• 領導者角色：整合協調者 (Synthesizer)\n• 關鍵動作：大會前私下一對一對齊，由下而上會簽審核。\n• 致命地雷：在正式會議強行舉手或當眾表態。", C_AMBER_LIGHT, C_AMBER),
        ("第二象限（左上）", "平等主義 × 共識型決策", "【荷蘭、北歐各國】\n• 決策機制：Polder Model 大 D\n• 領導者角色：中立促進者 (Facilitator)\n• 關鍵動作：全員公開透明共審，拍板即刻在石碑上不可翻案。\n• 致命地雷：私下密室妥協、威權壓迫或隨意翻案。", C_INDIGO_LIGHT, C_INDIGO),
        ("第三象限（左下）", "平等主義 × 由上而下速決", "【美國矽谷、英國新創】\n• 決策機制：小 d 敏捷試錯\n• 領導者角色：方向定舵者 (Steerer)\n• 關鍵動作：鼓勵平等暢所欲言，授權主管速決，後續 Hotfix。\n• 致命地雷：耗費數週追求全員共識，錯失市場先機。", C_GREEN_LIGHT, C_GREEN),
        ("第四象限（右下）", "階層制 × 由上而下速決", "【中國工廠、法國、印度】\n• 決策機制：Director 指揮模式\n• 領導者角色：最高指揮官 (Director)\n• 關鍵動作：危機時給予清晰步驟，領導者一肩承擔全部成敗。\n• 致命地雷：危機時要求基層投票表態，被視為推諉懦弱。", C_BLUE_LIGHT, C_BLUE),
    ]

    for i, (qname, qtype, qdesc, qbg, qborder) in enumerate(quadrants_summary):
        card = add_card(s13, Inches(0.8 + i * 2.98), Inches(1.5), col_w, col_h, bg_color=qbg, border_color=qborder)
        ctf = card.text_frame
        ctf.word_wrap = True
        ctf.margin_left = ctf.margin_top = ctf.margin_right = Inches(0.2)
        p = ctf.paragraphs[0]
        p.text = qname
        p.font.size = Pt(13)
        p.font.bold = True
        p.font.color.rgb = qborder
        p2 = ctf.add_paragraph()
        p2.text = qtype + "\n"
        p2.font.size = Pt(11)
        p2.font.bold = True
        p2.font.color.rgb = C_SLATE_DARK

        for line in qdesc.split('\n'):
            pl = ctf.add_paragraph()
            pl.text = line
            pl.font.size = Pt(10)
            pl.font.color.rgb = C_SLATE_MID

    add_notes(s13, "【全景總結引導】\n這張圖是整個工作坊最核心的知識圖譜。建議請學員拍照或存檔。帶領學員快速複習四個象限的國家代表與領導者角色轉換。")

    # =========================================================================
    # SLIDE 14: 核心辨析：大 D vs. 小 d
    # =========================================================================
    s14 = prs.slides.add_slide(blank_layout)
    set_bg(s14, C_SLATE_LIGHT)
    add_header(s14, "核心哲學碰撞：「大寫 D」與「小寫 d」的本質差異", "BIG D VS. LITTLE D")

    card_w = Inches(5.65)
    card_h = Inches(4.2)
    cd1 = add_card(s14, Inches(0.8), Inches(1.5), card_w, card_h, bg_color=C_WHITE, border_color=C_INDIGO)
    cd2 = add_card(s14, Inches(6.88), Inches(1.5), card_w, card_h, bg_color=C_WHITE, border_color=C_GREEN)

    # 大 D 卡片
    tf1 = cd1.text_frame
    tf1.word_wrap = True
    tf1.margin_left = tf1.margin_top = tf1.margin_right = Inches(0.3)
    p = tf1.paragraphs[0]
    p.text = "🏛️ 大寫 D（Big-D）：刻在石碑上的神聖承諾"
    p.font.size = Pt(16)
    p.font.bold = True
    p.font.color.rgb = C_INDIGO
    p_sub = tf1.add_paragraph()
    p_sub.text = "Decision as Final Commitment（日本、德國、荷蘭、北歐）\n"
    p_sub.font.size = Pt(11.5)
    p_sub.font.color.rgb = C_SLATE_MUTED

    d_items = [
        ("前期長考凝聚，後期零阻力執行", "前期花費大量時間讓所有人表達意見、反覆審核。這個過程可能很慢，但一旦拍板，代表全員簽字背書，後續執行如同高速列車，零阻力達成。"),
        ("隨意翻案等同摧毀信任", "如果主管隔週拿到新數據隨口說『我們換個方向』，在德國或日本團隊眼裡，這不是敏捷，而是雙面、不誠實、不尊重承諾。")
    ]
    for h, b in d_items:
        ph = tf1.add_paragraph()
        ph.text = "• " + h
        ph.font.bold = True
        ph.font.size = Pt(12)
        ph.font.color.rgb = C_SLATE_DARK
        pb = tf1.add_paragraph()
        pb.text = b + "\n"
        pb.font.size = Pt(11)
        pb.font.color.rgb = C_SLATE_MID

    # 小 d 卡片
    tf2 = cd2.text_frame
    tf2.word_wrap = True
    tf2.margin_left = tf2.margin_top = tf2.margin_right = Inches(0.3)
    p = tf2.paragraphs[0]
    p.text = "🚀 小寫 d（Little-d）：動態迭代的敏捷里程碑"
    p.font.size = Pt(16)
    p.font.bold = True
    p.font.color.rgb = C_GREEN
    p_sub2 = tf2.add_paragraph()
    p_sub2.text = "decision as Dynamic Milestone（美國矽谷、英國新創）\n"
    p_sub2.font.size = Pt(11.5)
    p_sub2.font.color.rgb = C_SLATE_MUTED

    littled_items = [
        ("快速拍板試跑，有新數據即刻修正", "認為前期花數週追求完美共識是浪費生命。決策只是當下最佳假設，先推上線、從市場反饋學習，有新數據隨時動態調整。"),
        ("過度追求共識等同保守官僚", "在矽谷文化中，追求每個人都同意只會產出平庸的妥協方案。主管的角色是維持前進速度，而不是讓所有人都滿意。")
    ]
    for h, b in littled_items:
        ph = tf2.add_paragraph()
        ph.text = "• " + h
        ph.font.bold = True
        ph.font.size = Pt(12)
        ph.font.color.rgb = C_SLATE_DARK
        pb = tf2.add_paragraph()
        pb.text = b + "\n"
        pb.font.size = Pt(11)
        pb.font.color.rgb = C_SLATE_MID

    # 底部衝突解方
    sol_card = add_card(s14, Inches(0.8), Inches(5.95), Inches(11.733), Inches(1.05), bg_color=C_NAVY, border_color=None)
    stf = sol_card.text_frame
    stf.word_wrap = True
    stf.margin_left = stf.margin_top = stf.margin_right = Inches(0.3)
    sp = stf.paragraphs[0]
    sp.text = "💡 跨國合作解方：導入「D 與 d 雙軌宣告協定」"
    sp.font.size = Pt(13)
    sp.font.bold = True
    sp.font.color.rgb = C_AMBER
    sp2 = stf.add_paragraph()
    sp2.text = "跨國管理最大的災難是用同一個英文單字『Decision』，雙方卻懷抱完全不同的心理預期！會議結束前，主持人必須明確宣告：這是不可輕易翻案的「大 D」，還是隨時可調的「小 d」？"
    sp2.font.size = Pt(11)
    sp2.font.color.rgb = C_WHITE

    add_notes(s14, "【大 D 與小 d 的案例】\n舉 Erin Meyer 書中德美合作的經典例子：美國大老闆開會喊『We have a decision!』，德國工程師通宵寫進規格書，三天後美國老闆說『我們換個方向』，德國團隊差點全員罷工！只要在會後加上一句宣告，就能省下數百萬美元的誤解成本。")

    # =========================================================================
    # SLIDE 15: HBR Linda Hill 領導三大要務自我檢核
    # =========================================================================
    s15 = prs.slides.add_slide(blank_layout)
    set_bg(s15, C_SLATE_LIGHT)
    add_header(s15, "HBR〈Being the Boss〉三大要務：跨文化卓越領導檢核", "THE THREE IMPERATIVES")

    imp_w = Inches(11.733)
    imp_h = Inches(1.6)
    imperatives = [
        ("要務一：管理自己（Manage Yourself）· 放下文化優越感", "從「用自己的文化尺規衡量他人」走向「因地制宜切換座標」。認知到文化風格沒有高下之分；領導者的權威不是來自職級或強推個人習慣，而是來自對在地脈絡的精準同理與適應力。", C_AMBER_LIGHT, C_AMBER),
        ("要務二：管理網絡（Manage Your Network）· 建立跨邊界同盟", "辨識跨國組織內部的「非正式權力地圖」。在階層制文化中尊重垂直網絡與長幼序位；在平等文化中建立橫向網絡。善用會前「根回（Nemawashi）」，將潛在抗拒者轉化為協作盟友。", C_BLUE_LIGHT, C_BLUE),
        ("要務三：打造團隊（Manage Your Team）· 建立多元心理安全感", "建立容許不同發言風格的團隊文化常規（Team Norms）。為習慣沉默的成員打造非正式一對一表達管道，為敏捷直率的成員規範決策界限，將文化衝突轉化為跨國創新的核心競爭力。", C_GREEN_LIGHT, C_GREEN),
    ]

    for i, (ititle, idesc, ibg, iborder) in enumerate(imperatives):
        card = add_card(s15, Inches(0.8), Inches(1.5 + i * 1.8), imp_w, imp_h, bg_color=ibg, border_color=iborder)
        ctf = card.text_frame
        ctf.word_wrap = True
        ctf.margin_left = ctf.margin_top = ctf.margin_right = Inches(0.3)
        p = ctf.paragraphs[0]
        p.text = ititle
        p.font.size = Pt(15)
        p.font.bold = True
        p.font.color.rgb = iborder
        p2 = ctf.add_paragraph()
        p2.text = idesc
        p2.font.size = Pt(11.5)
        p2.font.color.rgb = C_SLATE_DARK

    add_notes(s15, "【回歸核心領導力】\nLinda Hill 與 Kent Lineback 在《Being the Boss》強調：管理自己是基礎，管理網絡是槓桿，打造團隊是成果。跨文化環境放大了這三大要務的張力，唯有持續反思自我、經營網絡並賦能團隊，才能成為卓越的領導者。")

    # =========================================================================
    # SLIDE 16: 結語與文化王加冕 (Wrap-Up & Award)
    # =========================================================================
    s16 = prs.slides.add_slide(blank_layout)
    set_bg(s16, C_NAVY)

    add_card(s16, Inches(0.8), Inches(0.9), Inches(11.733), Inches(5.7), bg_color=C_SLATE_DARK, border_color=C_AMBER)

    crown_box = s16.shapes.add_textbox(Inches(1.0), Inches(1.3), Inches(11.333), Inches(0.8))
    ctf = crown_box.text_frame
    cp = ctf.paragraphs[0]
    cp.text = "👑 文化王加冕儀式 👑"
    cp.font.size = Pt(32)
    cp.font.bold = True
    cp.font.color.rgb = C_AMBER
    cp.alignment = PP_ALIGN.CENTER

    sub_box = s16.shapes.add_textbox(Inches(1.0), Inches(2.2), Inches(11.333), Inches(0.6))
    stf = sub_box.text_frame
    sp = stf.paragraphs[0]
    sp.text = "恭喜四輪累計積分最高組別 · 榮獲《年度跨文化領導王》桂冠"
    sp.font.size = Pt(18)
    sp.font.bold = True
    sp.font.color.rgb = C_WHITE
    sp.alignment = PP_ALIGN.CENTER

    # 結語金句大卡片
    golden_card = add_card(s16, Inches(1.5), Inches(3.0), Inches(10.333), Inches(1.8), bg_color=C_NAVY, border_color=C_SLATE_MID)
    gtf = golden_card.text_frame
    gtf.word_wrap = True
    gtf.margin_left = gtf.margin_top = gtf.margin_right = Inches(0.4)
    gp1 = gtf.paragraphs[0]
    gp1.text = "「卓越的跨文化領導者，從不要求世界配合自己的節奏，\n而是靈活駕馭光譜，帶領多元團隊跨越邊界、抵達終點。」"
    gp1.font.size = Pt(18)
    gp1.font.bold = True
    gp1.font.color.rgb = C_AMBER_LIGHT
    gp1.alignment = PP_ALIGN.CENTER
    gp2 = gtf.add_paragraph()
    gp2.text = "— 跨文化團隊決策與說服競技場 · 誰是文化王"
    gp2.font.size = Pt(12)
    gp2.font.color.rgb = C_SLATE_MUTED
    gp2.alignment = PP_ALIGN.RIGHT

    # 課堂結算說明盒
    calc_box = s16.shapes.add_textbox(Inches(1.5), Inches(5.1), Inches(10.333), Inches(1.0))
    ctf2 = calc_box.text_frame
    ctf2.word_wrap = True
    cp1 = ctf2.paragraphs[0]
    cp1.text = "📊 實體計分結算指南："
    cp1.font.size = Pt(13)
    cp1.font.bold = True
    cp1.font.color.rgb = C_BLUE_LIGHT
    cp2 = ctf2.add_paragraph()
    cp2.text = "請各組加總四回合累計得分（每輪滿分 100 分，總分 400 分），最高分組別即為本場次文化王！\n感謝全體學員的深度思辨與跨文化激盪，帶著今日的座標洞察，回到明天的真實領導對話！"
    cp2.font.size = Pt(11.5)
    cp2.font.color.rgb = RGBColor(226, 232, 240)

    add_notes(s16, "【結尾頒獎詞】\n請講師統計各組總分，邀請冠軍組別起立接受全場鼓掌，頒發象徵性的文化王榮譽，並邀請冠軍組代表用一句話分享今天最深刻的跨文化頓悟！")

    output_path = "/Users/routertt/Documents/OB/GPT/誰是文化王_備案簡報_Who_Is_Culture_King.pptx"
    prs.save(output_path)
    print(f"Successfully generated presentation at: {output_path}")

    # 同步複製一份至外層 workspace root 方便直接取用
    os.system(f"cp '{output_path}' '/Users/routertt/Documents/OB/誰是文化王_備案簡報_Who_Is_Culture_King.pptx'")
    print("Copied to workspace root!")

if __name__ == '__main__':
    build_presentation()
