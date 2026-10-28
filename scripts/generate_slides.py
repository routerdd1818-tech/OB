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
    C_NAVY = RGBColor(15, 23, 42)          # #0f172a
    C_BLUE_CARD = RGBColor(30, 58, 138)    # #1e3a8a deep royal navy (Image 5 style)
    C_SLATE_DARK = RGBColor(30, 41, 59)    # #1e293b
    C_SLATE_MID = RGBColor(71, 85, 105)    # #475569
    C_SLATE_MUTED = RGBColor(100, 116, 139)# #64748b
    C_SLATE_LIGHT = RGBColor(241, 245, 249)# #f1f5f9
    C_WHITE = RGBColor(255, 255, 255)
    C_AMBER = RGBColor(217, 119, 6)        # #d97706
    C_AMBER_LIGHT = RGBColor(254, 243, 199)# #fef3c7
    C_BLUE = RGBColor(2, 132, 199)         # #0284c7
    C_BLUE_LIGHT = RGBColor(224, 242, 254) # #e0f2fe
    C_GREEN = RGBColor(5, 150, 105)        # #059669
    C_GREEN_LIGHT = RGBColor(209, 250, 229)# #d1fae5
    C_RED = RGBColor(220, 38, 38)          # #dc2626
    C_RED_LIGHT = RGBColor(254, 226, 226)  # #fee2e2
    C_INDIGO = RGBColor(79, 70, 229)       # #4f46e5
    C_INDIGO_LIGHT = RGBColor(238, 242, 255)# #eef2ff
    C_LINE = RGBColor(226, 232, 240)       # #e2e8f0

    def set_bg(slide, color):
        bg = slide.shapes.add_shape(MSO_SHAPE.RECTANGLE, 0, 0, prs.slide_width, prs.slide_height)
        bg.fill.solid()
        bg.fill.fore_color.rgb = color
        bg.line.fill.background()
        return bg

    def add_header(slide, title, eyebrow=None, dark=False):
        top_offset = Inches(0.4)
        if eyebrow:
            box_e = slide.shapes.add_textbox(Inches(0.8), top_offset, Inches(11.7), Inches(0.3))
            tf_e = box_e.text_frame
            tf_e.word_wrap = True
            tf_e.margin_left = tf_e.margin_top = tf_e.margin_right = tf_e.margin_bottom = 0
            p_e = tf_e.paragraphs[0]
            p_e.text = eyebrow.upper()
            p_e.font.size = Pt(11)
            p_e.font.bold = True
            p_e.font.color.rgb = C_AMBER if dark else C_BLUE
            top_offset += Inches(0.28)

        box_t = slide.shapes.add_textbox(Inches(0.8), top_offset, Inches(11.7), Inches(0.6))
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
            ("左上象限\n平等 × 由上而下\n（美國、英國）", l, t, half, half, C_INDIGO_LIGHT if highlight_zone in ['Q_TL', 'TL', '左上', 'Q3'] else RGBColor(248, 250, 252)),
            ("右上象限\n階級 × 由上而下\n（中國、法國）", l + half, t, half, half, C_AMBER_LIGHT if highlight_zone in ['Q_TR', 'TR', '右上', 'Q2'] else RGBColor(248, 250, 252)),
            ("左下象限\n平等 × 共識\n（丹麥、荷蘭）", l, t + half, half, half, C_GREEN_LIGHT if highlight_zone in ['Q_BL', 'BL', '左下', 'Q4'] else RGBColor(248, 250, 252)),
            ("右下象限\n階級 × 共識\n（德國、日本）", l + half, t + half, half, half, C_BLUE_LIGHT if highlight_zone in ['Q_BR', 'BR', '右下', 'Q1'] else RGBColor(248, 250, 252)),
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
            p.font.size = Pt(10)
            p.font.bold = True
            p.font.color.rgb = C_SLATE_DARK
            p.alignment = PP_ALIGN.CENTER
            for extra_line in lines[1:]:
                p_extra = tf.add_paragraph()
                p_extra.text = extra_line
                p_extra.font.size = Pt(8.5)
                p_extra.font.color.rgb = C_SLATE_MID
                p_extra.alignment = PP_ALIGN.CENTER

        # 目標座標靶心
        if target_x is not None and target_y is not None:
            cx = l + (target_x / 100.0) * size
            cy = t + ((100.0 - target_y) / 100.0) * size
            r = Inches(0.24)
            pin = slide.shapes.add_shape(MSO_SHAPE.OVAL, cx - r/2, cy - r/2, r, r)
            pin.fill.solid()
            pin.fill.fore_color.rgb = C_RED
            pin.line.color.rgb = C_WHITE
            pin.line.width = Pt(1.5)

    def add_scenario_slide_with_comic(slide_title, eyebrow, location, comic_file, dialogues, prompt, notes_text):
        s = prs.slides.add_slide(blank_layout)
        set_bg(s, C_SLATE_LIGHT)
        add_header(s, slide_title, eyebrow)

        comic_path = f"/Users/routertt/Documents/OB/GPT/public/comics/{comic_file}"
        c_left = Inches(0.8)
        c_top = Inches(1.35)
        c_size = Inches(5.5)

        # 漫畫卡片包裝（放大呈現）
        add_card(s, c_left - Inches(0.06), c_top - Inches(0.06), c_size + Inches(0.12), c_size + Inches(0.12), bg_color=C_WHITE, border_color=C_LINE)
        if os.path.exists(comic_path):
            s.shapes.add_picture(comic_path, c_left, c_top, c_size, c_size)

        # 右側情境對白卡片
        r_left = Inches(6.55)
        r_w = Inches(5.98)
        dialogue_card = add_card(s, r_left, c_top, r_w, Inches(4.25), bg_color=C_WHITE, border_color=C_LINE)
        dtf = dialogue_card.text_frame
        dtf.word_wrap = True
        dtf.margin_left = dtf.margin_right = Inches(0.28)
        dtf.margin_top = Inches(0.22)

        p_loc = dtf.paragraphs[0]
        p_loc.text = f"📍 {location}"
        p_loc.font.size = Pt(13)
        p_loc.font.bold = True
        p_loc.font.color.rgb = C_BLUE

        for who, text in dialogues:
            pw = dtf.add_paragraph()
            pw.space_before = Pt(6)
            pw.text = f"【{who}】"
            pw.font.size = Pt(11)
            pw.font.bold = True
            pw.font.color.rgb = C_SLATE_DARK

            pt = dtf.add_paragraph()
            pt.text = text
            pt.font.size = Pt(10.5)
            pt.font.color.rgb = C_SLATE_MID
            pt.line_spacing = 1.25

        # 底部決策任務盒
        prompt_card = add_card(s, r_left, c_top + Inches(4.4), r_w, Inches(1.1), bg_color=C_NAVY, border_color=None)
        ptf = prompt_card.text_frame
        ptf.word_wrap = True
        ptf.margin_left = ptf.margin_right = Inches(0.25)
        ptf.margin_top = Inches(0.15)
        pp = ptf.paragraphs[0]
        pp.text = f"⏱️ 決策課題：{prompt}"
        pp.font.size = Pt(12)
        pp.font.bold = True
        pp.font.color.rgb = C_AMBER_LIGHT

        add_notes(s, notes_text)
        return s

    def add_reveal_slide_image5(slide_title, eyebrow, zone_pos, zone_title, zone_sub, target_x, target_y, target_quadrant, clue, culture_feat, blindspot, correct_action, notes_text, countries=""):
        s = prs.slides.add_slide(blank_layout)
        set_bg(s, C_SLATE_LIGHT)
        add_header(s, slide_title, eyebrow)

        # 左側大卡片（精準復刻 Image 5 樣式：深藍色卡片）
        card_t = Inches(1.35)
        card_h = Inches(5.6)
        l_w = Inches(4.5)
        l_card = s.shapes.add_shape(MSO_SHAPE.ROUNDED_RECTANGLE, Inches(0.8), card_t, l_w, card_h)
        l_card.fill.solid()
        l_card.fill.fore_color.rgb = C_BLUE_CARD
        l_card.line.fill.background()

        ltf = l_card.text_frame
        ltf.word_wrap = True
        ltf.margin_left = ltf.margin_right = Inches(0.25)
        ltf.margin_top = Inches(0.35)

        p1 = ltf.paragraphs[0]
        p1.text = f"正確答案（{zone_pos}）"
        p1.font.size = Pt(15)
        p1.font.bold = True
        p1.font.color.rgb = RGBColor(191, 219, 254) # #bfdbfe
        p1.alignment = PP_ALIGN.CENTER

        p2 = ltf.add_paragraph()
        p2.text = zone_title
        p2.font.size = Pt(36)
        p2.font.bold = True
        p2.font.color.rgb = C_WHITE
        p2.alignment = PP_ALIGN.CENTER

        p3 = ltf.add_paragraph()
        p3.text = zone_sub
        p3.font.size = Pt(16)
        p3.font.bold = True
        p3.font.color.rgb = RGBColor(254, 243, 199)
        p3.alignment = PP_ALIGN.CENTER

        if countries:
            p3_c = ltf.add_paragraph()
            p3_c.space_before = Pt(4)
            p3_c.text = f"【代表國家：{countries}】"
            p3_c.font.size = Pt(13)
            p3_c.font.bold = True
            p3_c.font.color.rgb = RGBColor(147, 197, 253)
            p3_c.alignment = PP_ALIGN.CENTER

        p4 = ltf.add_paragraph()
        p4.space_before = Pt(6)
        p4.text = f"🎯 靶心座標：({target_x}, {target_y})"
        p4.font.size = Pt(12)
        p4.font.color.rgb = RGBColor(226, 232, 240)
        p4.alignment = PP_ALIGN.CENTER

        p5 = ltf.add_paragraph()
        p5.space_before = Pt(8)
        p5.text = "選對組別 + 100 分"
        p5.font.size = Pt(15)
        p5.font.bold = True
        p5.font.color.rgb = RGBColor(250, 204, 21) # #facc15 gold
        p5.alignment = PP_ALIGN.CENTER

        # 左側卡片底部的微型四象限圖
        draw_quadrant(s, Inches(1.8), Inches(4.5), Inches(2.3), target_x=target_x, target_y=target_y, highlight_zone=target_quadrant)

        # 右側白底列點卡片（精準復刻 Image 5 樣式：四大原因清晰列點）
        r_w = Inches(7.033)
        r_card = add_card(s, Inches(5.5), card_t, r_w, card_h, bg_color=C_WHITE, border_color=C_LINE)
        rtf = r_card.text_frame
        rtf.word_wrap = True
        rtf.margin_left = rtf.margin_right = Inches(0.4)
        rtf.margin_top = Inches(0.3)

        p_rh = rtf.paragraphs[0]
        p_rh.text = f"文獻理論依據與決策盲點解析"
        p_rh.font.size = Pt(18)
        p_rh.font.bold = True
        p_rh.font.color.rgb = C_SLATE_DARK

        if countries:
            p_rh_c = rtf.add_paragraph()
            p_rh_c.space_before = Pt(3)
            p_rh_c.text = f"代表國家：{countries}"
            p_rh_c.font.size = Pt(13.5)
            p_rh_c.font.bold = True
            p_rh_c.font.color.rgb = C_BLUE

        bullets = [
            ("題目線索", clue, C_INDIGO),
            ("文化特徵", culture_feat, C_BLUE),
            ("管理盲點", blindspot, C_AMBER),
            ("正確對策", correct_action, C_GREEN),
        ]

        for label, text, color in bullets:
            p_lbl = rtf.add_paragraph()
            p_lbl.space_before = Pt(9)
            p_lbl.text = f"{label}："
            p_lbl.font.size = Pt(14)
            p_lbl.font.bold = True
            p_lbl.font.color.rgb = color

            p_txt = rtf.add_paragraph()
            p_txt.text = text
            p_txt.font.size = Pt(12)
            p_txt.font.color.rgb = C_SLATE_MID
            p_txt.line_spacing = 1.25

        add_notes(s, notes_text)
        return s

    # =========================================================================
    # SLIDE 1: 封面
    # =========================================================================
    s1 = prs.slides.add_slide(blank_layout)
    set_bg(s1, C_NAVY)
    add_card(s1, Inches(0.8), Inches(0.9), Inches(11.733), Inches(5.7), bg_color=C_SLATE_DARK, border_color=C_SLATE_MID)

    tag_box = s1.shapes.add_shape(MSO_SHAPE.ROUNDED_RECTANGLE, Inches(1.3), Inches(1.4), Inches(2.6), Inches(0.4))
    tag_box.fill.solid()
    tag_box.fill.fore_color.rgb = C_AMBER
    tag_box.line.fill.background()
    p = tag_box.text_frame.paragraphs[0]
    p.text = "工作坊備用簡報"
    p.font.size = Pt(11)
    p.font.bold = True
    p.font.color.rgb = C_NAVY
    p.alignment = PP_ALIGN.CENTER

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

    desc_box = s1.shapes.add_textbox(Inches(1.3), Inches(3.8), Inches(10.5), Inches(1.4))
    tf2 = desc_box.text_frame
    tf2.word_wrap = True
    p3 = tf2.paragraphs[0]
    p3.text = "誰是文化王 · 跨文化決策與說服競技場"
    p3.font.size = Pt(14)
    p3.font.bold = True
    p3.font.color.rgb = C_BLUE_LIGHT
    p4 = tf2.add_paragraph()
    p4.text = "結合四格漫畫實境、四象限落點盲測、歐幾里得距離計分法與經典案例深度覆盤。"
    p4.font.size = Pt(13)
    p4.font.color.rgb = RGBColor(203, 213, 225)

    features = ["📍 2×2 決策象限盲測", "🎯 歐幾里得距離精準計分", "👑 跨立場說服王機制", "📚 哈佛商業評論 組織領導矩陣"]
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

    add_notes(s1, "【講師開場】歡迎大家來到《誰是文化王》。今天每一組將化身跨國整合專案組，面對 4 場海外真實衝突，在四象限地圖上盲測落點，角逐全場文化王！")

    # =========================================================================
    # SLIDE 2: 理論基石
    # =========================================================================
    s2 = prs.slides.add_slide(blank_layout)
    set_bg(s2, C_SLATE_LIGHT)
    add_header(s2, "理論基石：跨文化決策的兩大核心維度", "理論基礎：決策維度解析")

    col_w = Inches(5.65)
    card_h = Inches(4.3)
    c1 = add_card(s2, Inches(0.8), Inches(1.5), col_w, card_h)
    c2 = add_card(s2, Inches(6.88), Inches(1.5), col_w, card_h)

    tf1 = c1.text_frame
    tf1.word_wrap = True
    tf1.margin_left = tf1.margin_top = tf1.margin_right = Inches(0.3)
    p = tf1.paragraphs[0]
    p.text = "橫軸（X 軸）：權力距離維度"
    p.font.size = Pt(18)
    p.font.bold = True
    p.font.color.rgb = C_BLUE
    p_sub = tf1.add_paragraph()
    p_sub.text = "平等主義 (0) ↔ 階層制 (100)\n"
    p_sub.font.size = Pt(12)
    p_sub.font.color.rgb = C_SLATE_MUTED

    items_x = [
        ("平等主義（0 ~ 35）", "組織結構極度扁平，員工習慣直呼主管名字。基層被賦予高度話語權，跨級直接溝通被視為高效與坦率，主管扮演「平等促進者」。"),
        ("階層制（65 ~ 100）", "重視組織序列與職級尊卑。溝通與決策嚴格遵循層級鏈條，越級報告被視為挑釁與失序。基層敬畏權威，主管具備明確指導權與最終責任。")
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

    tf2 = c2.text_frame
    tf2.word_wrap = True
    tf2.margin_left = tf2.margin_top = tf2.margin_right = Inches(0.3)
    p = tf2.paragraphs[0]
    p.text = "縱軸（Y 軸）：決策方式維度"
    p.font.size = Pt(18)
    p.font.bold = True
    p.font.color.rgb = C_AMBER
    p_sub2 = tf2.add_paragraph()
    p_sub2.text = "由上而下速決 (0) ↔ 全員共識決策 (100)\n"
    p_sub2.font.size = Pt(12)
    p_sub2.font.color.rgb = C_SLATE_MUTED

    items_y = [
        ("由上而下速決（0 ~ 35）", "決策講求速度與效率。主管聽取意見後迅速拍板（小速決模式）。決策被視為「動態里程碑」，隨時可依新數據敏捷微調。"),
        ("全員共識決策（65 ~ 100）", "追求全員一致同意與深度承諾（大承諾模式）。前期花費大量時間會前溝通摸底，一旦拍板如石碑不可輕易翻案。")
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

    add_card(s2, Inches(0.8), Inches(6.05), Inches(11.733), Inches(0.9), bg_color=C_NAVY, border_color=None)
    bottom_box = s2.shapes.add_textbox(Inches(1.0), Inches(6.15), Inches(11.333), Inches(0.7))
    btf = bottom_box.text_frame
    btf.word_wrap = True
    bp = btf.paragraphs[0]
    bp.text = "💡 跨文化領導的核心啟示：沒有放之四海皆準的領導風格。卓越管理者從不強求團隊改變團隊文化底蘊，而是精準調整自己的決策座標！"
    bp.font.size = Pt(13)
    bp.font.bold = True
    bp.font.color.rgb = C_AMBER_LIGHT

    add_notes(s2, "向學員強調：X 軸是『權力與距離』，Y 軸是『速度與共識』。跨國管理最大的盲點就是誤以為平等一定共識、階層一定獨裁。")

    # =========================================================================
    # SLIDE 3: 2×2 決策象限圖解矩陣
    # =========================================================================
    s3 = prs.slides.add_slide(blank_layout)
    set_bg(s3, C_SLATE_LIGHT)
    add_header(s3, "2×2 決策矩陣：全球四大文化原型", "四象限決策矩陣")

    draw_quadrant(s3, Inches(0.8), Inches(1.7), Inches(4.8))

    right_w = Inches(6.0)
    cards_info = [
        ("左上象限：平等 × 由上而下", "【美國、英國】扁平極客文化，鼓勵直抒己見甚至挑戰主管；但決策採「小速決」模式，由主管快速拍板，先試跑再動態修補。", C_INDIGO_LIGHT, C_INDIGO),
        ("右上象限：階級 × 由上而下", "【中國、法國】強調最高主管威權指揮（最高指揮官模式）。危機時刻基層渴望明確指令，領導者必須一肩扛起成敗責任。", C_AMBER_LIGHT, C_AMBER),
        ("左下象限：平等 × 共識", "【丹麥、荷蘭】基層與主管平起平坐，人人皆有一票否決權。領導者為「促進者」，追求刻在石碑上的神聖大承諾。", C_GREEN_LIGHT, C_GREEN),
        ("右下象限：階級 × 共識", "【德國、日本】嚴明職級尊重與全員共識並存。正式會議僅為形式用印，真正的決策必須在會前依職級序列由下而上完成「會前私下摸底（根回）」。", C_BLUE_LIGHT, C_BLUE),
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

    add_notes(s3, "引導學員注意這張圖的四個角落，接下來的 4 個實戰案例分別座落在這 4 個象限中。")

    # =========================================================================
    # SLIDE 4: 實體備案遊戲規則與計分公式
    # =========================================================================
    s4 = prs.slides.add_slide(blank_layout)
    set_bg(s4, C_SLATE_LIGHT)
    add_header(s4, "實體備案遊戲規則與歐幾里得距離計分法", "規則與計分法")

    step_w = Inches(3.68)
    step_h = Inches(3.2)
    steps = [
        ("階段一 · 盲測落點", "閱讀現場對白與漫畫情境\n小組研討 3 分鐘\n在象限圖上標出\n本組決策座標 (X, Y)\n(0~100 數值)", C_BLUE, "⏱️ 研討限時 3 分鐘"),
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

    score_card = add_card(s4, Inches(0.8), Inches(4.95), Inches(11.733), Inches(2.0), bg_color=C_NAVY, border_color=None)
    stf2 = score_card.text_frame
    stf2.word_wrap = True
    stf2.margin_left = stf2.margin_top = stf2.margin_right = Inches(0.3)
    p = stf2.paragraphs[0]
    p.text = "📐 歐幾里得距離計分機制"
    p.font.size = Pt(16)
    p.font.bold = True
    p.font.color.rgb = C_AMBER

    p_f = stf2.add_paragraph()
    p_f.text = "誤差距離 ＝ 根號底下兩軸座標差平方和   ｜   本輪得分 ＝ 100 扣除誤差距離（最低 0 分）"
    p_f.font.size = Pt(14)
    p_f.font.bold = True
    p_f.font.color.rgb = C_WHITE

    p_tiers = stf2.add_paragraph()
    p_tiers.text = "• 🎯 完美命中（d ≤ 15 格）：精準切中該文化核心！得分 85 ~ 100 分\n• 🟢 精準落點（15 < d ≤ 30 格）：落入正確象限核心區！得分 70 ~ 85 分\n• 🟡 方向尚可（30 < d ≤ 50 格）：掌握大方向但力道有偏差，得分 50 ~ 70 分\n• 🔴 嚴重偏離（d > 50 格）：落入完全相反象限，引發跨文化衝突危機！得分低於 50 分"
    p_tiers.font.size = Pt(11)
    p_tiers.font.color.rgb = RGBColor(226, 232, 240)

    add_notes(s4, "請各組隊長在紙上寫下他們決定的 (X, Y) 座標並高舉亮出！")

    # =========================================================================
    # SLIDE 5: CASE 01 題目情境（附 4 格漫畫）
    # =========================================================================
    add_scenario_slide_with_comic(
        slide_title="案例一 · 沉默的正式會議與消失的測試數據",
        eyebrow="第一回合 · 情境挑戰",
        location="海外併購 · 精密研發中心",
        comic_file="case1_alpha.png",
        dialogues=[
            ("週一全體大會", "你：「提議縮短高溫測試工時兩成，大家有無異議？」全場低頭抄筆記，一片沉默……"),
            ("技術主管態度", "技術主管微笑：「我們會盡力研究。」你心想：太好了，大家都同意！"),
            ("週三產線現場", "來到產線，測試爐工時仍為百分之百，產線完全沒動！"),
            ("茶水間外議論", "員工私下罵你破壞規則：「沒有在會議前先跟大家討論，根本不尊重專業！」")
        ],
        prompt="面對會議全員沉默抄筆記、會後產線完全不動的局面，你的領導決策座標落點在哪裡？",
        notes_text="【引導提示】為什麼技術主管會上不反對會後不動？為什麼員工私下批評未在會議前討論是破壞規則？"
    )

    # =========================================================================
    # SLIDE 6: 案例一 答案揭曉（Image 5 精緻列點樣式）
    # =========================================================================
    add_reveal_slide_image5(
        slide_title="案例一 答案揭曉 · 右下象限（右下：橫軸 78，縱軸 18）",
        eyebrow="第一回合 · 答案揭曉與文獻深度解析",
        zone_pos="右下",
        zone_title="右下象限",
        zone_sub="階級 × 共識",
        target_x=78,
        target_y=18,
        target_quadrant="右下",
        clue="大會全員沉默低頭反映重階級；私下批評未在會前討論，則反映需事前摸底（根回）凝聚共識。",
        culture_feat="兼具嚴明的職級尊卑與全員深度共識，重視循序漸進的組織倫理與事前校準。",
        blindspot="誤以為大會能直接討論拍板；在該文化中大會僅為用印儀式，未經會前私下摸底（根回）強推必遭消極抗命。",
        correct_action="尊重既有職級序列，會前透過資深幹部由下而上私下溝通、全員完成會簽後再開會確認。",
        notes_text="【計分引導】靶心座標為 (78, 18)。請計算距離 d = √[(X-78)² + (Y-18)²]，得分為 100 - d。",
        countries="德國、日本"
    )

    # =========================================================================
    # SLIDE 7: CASE 02 題目情境（附 4 格漫畫）
    # =========================================================================
    add_scenario_slide_with_comic(
        slide_title="案例二 · 良率暴跌夜的群組風暴",
        eyebrow="第二回合 · 情境挑戰",
        location="海外量產 · 核心試產基地",
        comic_file="case2_beta.png",
        dialogues=[
            ("凌晨兩點十分", "塗佈機良率雪崩跌至四成八！產線領班大驚失色。"),
            ("廠長強制停機", "資深廠長：「立刻停線，把機台洗乾淨！」機台強制按下停機。"),
            ("群組爭吵甩鍋", "試產組工程師在群組內激烈甩鍋：「是塗佈液的問題！」「延誤你們扛！」"),
            ("產線領班求救", "領班私訊：「現在到底該聽誰的？請給我們明確裁示，否則沒人敢動手！」")
        ],
        prompt="距離交貨剩四小時，面對團隊恐懼責任且無人敢動手，你的領導決策座標落點在哪裡？",
        notes_text="【引導提示】為什麼領班說『沒明確裁示沒人敢動手』？危機時刻要求共識會引發什麼反效果？"
    )

    # =========================================================================
    # SLIDE 8: 案例二 答案揭曉（Image 5 精緻列點樣式）
    # =========================================================================
    add_reveal_slide_image5(
        slide_title="案例二 答案揭曉 · 右上象限（右上：橫軸 84，縱軸 82）",
        eyebrow="第二回合 · 答案揭曉與文獻深度解析",
        zone_pos="右上",
        zone_title="右上象限",
        zone_sub="階級 × 由上而下",
        target_x=84,
        target_y=82,
        target_quadrant="右上",
        clue="基層無人敢擅自做主反映重階層；領班急求主管明確裁示，反映危機時仰賴由上而下拍板擔責。",
        culture_feat="導演式指揮模式，高度重視階級秩序，危機時刻基層仰賴最高主管明確指令。",
        blindspot="在危機時刻若尋求民主討論凝聚共識，會被基層視為軟弱、無能且推卸責任。",
        correct_action="主管迅速聽取關鍵資訊後果斷拍板，下達清晰執行步驟，並由最高主管親自扛起成敗責任。",
        notes_text="【計分引導】靶心座標為 (84, 82)。交期只剩四小時的危機中，尋求共識會被視為卸責。",
        countries="中國、法國"
    )

    # =========================================================================
    # SLIDE 9: CASE 03 題目情境（附 4 格漫畫）
    # =========================================================================
    add_scenario_slide_with_comic(
        slide_title="案例三 · 被工程師直接推翻的封版時程",
        eyebrow="第三回合 · 情境挑戰",
        location="新創研發 · 高速運算實驗室",
        comic_file="case3_gamma.png",
        dialogues=[
            ("封版倒數三十六小時", "站立會議上，年輕核心工程師直接對你嗆聲：「你昨天定的架構太保守了！」"),
            ("大膽激進提案", "他拿出私下寫的新演算法原型：「效能提升兩倍！現在就推上線，有問題明天再線上修補！」（邊界條件一成五未測）"),
            ("團隊全員起鬨", "團隊成員紛紛附和：「值得賭一把！」「先上了再說！」"),
            ("品保主管沉默", "品保主管面色凝重，沉默看向你等待定奪……倒數只剩三十五小時！")
        ],
        prompt="面對成員大膽挑戰既有架構並要求立即上線，你的領導決策座標落點在哪裡？",
        notes_text="【引導提示】年輕人敢當面挑戰主管反映極低權力距離；先上線有問題再修補反映小速決思維。"
    )

    # =========================================================================
    # SLIDE 10: 案例三 答案揭曉（Image 5 精緻列點樣式）
    # =========================================================================
    add_reveal_slide_image5(
        slide_title="案例三 答案揭曉 · 左上象限（左上：橫軸 22，縱軸 76）",
        eyebrow="第三回合 · 答案揭曉與文獻深度解析",
        zone_pos="左上",
        zone_title="左上象限",
        zone_sub="平等 × 由上而下",
        target_x=22,
        target_y=76,
        target_quadrant="左上",
        clue="工程師當面直言挑戰主管反映極致平等；崇尚先跑再修並由主管拍板，反映由上而下敏捷速決。",
        culture_feat="敏捷試錯模式，組織極度扁平，決策採小速決快速推進與動態修補。",
        blindspot="若開馬拉松會議追求完美共識，會被視為官僚、保守且缺乏魄力與市場速度。",
        correct_action="肯定創新熱情並迅速拍板小規模試跑（如灰度發布），保留後續動態修補彈性。",
        notes_text="【計分引導】靶心座標為 (22, 76)。引導學員理解敏捷文化中的小速決思維。",
        countries="美國、英國"
    )

    # =========================================================================
    # SLIDE 11: CASE 04 題目情境（附 4 格漫畫）
    # =========================================================================
    add_scenario_slide_with_comic(
        slide_title="案例四 · 首發登台前兩小時的極限攤牌",
        eyebrow="第四回合 · 情境挑戰",
        location="全球首發 · 戰略客戶攤牌現場",
        comic_file="case4_delta.png",
        dialogues=[
            ("發表會前兩小時", "全球發表會倒數兩小時，最大客戶技術長帶著兩名年輕測試員突然直接走進後台。"),
            ("現場攤牌報告", "啪！測試員將「極端低溫環境訊號衰減報告」拍在桌上！"),
            ("基層堅持把關", "年輕測試員：「在我們團隊裡，每位技術員都有權為安全把關，我們不在乎你的職銜或賠償金。」"),
            ("拒絕私下妥協", "「若非雙方工程師公開透明共同審核並達成一致協議，我們絕不簽署放行同意書！」")
        ],
        prompt="發表會倒數兩小時，面對客戶技術員在後台強硬阻擋放行，你的領導決策座標落點在哪裡？",
        notes_text="【引導提示】為什麼技術長不能強推？面對高平等高共識文化，威權與商業收買完全無效。"
    )

    # =========================================================================
    # SLIDE 12: 案例四 答案揭曉（Image 5 精緻列點樣式）
    # =========================================================================
    add_reveal_slide_image5(
        slide_title="案例四 答案揭曉 · 左下象限（左下：橫軸 18，縱軸 15）",
        eyebrow="第四回合 · 答案揭曉與文獻深度解析",
        zone_pos="左下",
        zone_title="左下象限",
        zone_sub="平等 × 共識",
        target_x=18,
        target_y=15,
        target_quadrant="左下",
        clue="基層測試員平起平坐主導談判反映高度平等；堅持全員公開共審達成一致，反映神聖共識大承諾。",
        culture_feat="低地協商模式，基層工程師擁有一票否決權，追求刻在石碑上的神聖大承諾。",
        blindspot="試圖透過職級施壓或私下利益妥協，會被視為踐踏專業誠信與違背團隊共識。",
        correct_action="主管轉化為中立協調促進者，召集雙方技術人員公開數據、透明共審，凝聚神聖共識。",
        notes_text="【計分引導】靶心座標為 (18, 15)。至此四回合已全部揭曉，請各組加總四輪總積分！",
        countries="丹麥、荷蘭"
    )

    # =========================================================================
    # SLIDE 13: 跨文化決策全景對照表
    # =========================================================================
    s13 = prs.slides.add_slide(blank_layout)
    set_bg(s13, C_SLATE_LIGHT)
    add_header(s13, "跨文化決策全景：四大象限策略對照矩陣", "跨文化決策全景對照表")

    col_w = Inches(2.78)
    col_h = Inches(5.3)
    quadrants_summary = [
        ("左上象限", "平等 × 由上而下", "【美國、英國】\n• 決策機制：小速決敏捷試錯\n• 領導者角色：方向定舵者 \n• 關鍵動作：鼓勵平等暢所欲言，授權主管速決，後續線上動態修補。\n• 致命地雷：耗費數週追求全員共識，錯失市場先機。", C_INDIGO_LIGHT, C_INDIGO),
        ("右上象限", "階級 × 由上而下", "【中國、法國】\n• 決策機制：指揮官指揮模式\n• 領導者角色：最高指揮官 \n• 關鍵動作：危機時給予清晰步驟，領導者一肩承擔全部成敗。\n• 致命地雷：危機時要求基層投票表態，被視為推諉懦弱。", C_AMBER_LIGHT, C_AMBER),
        ("左下象限", "平等 × 共識", "【丹麥、荷蘭】\n• 決策機制：低地共識協商模式\n• 領導者角色：中立促進者 \n• 關鍵動作：全員公開透明共審，拍板即刻在石碑上不可翻案。\n• 致命地雷：私下密室妥協、威權壓迫或隨意翻案。", C_GREEN_LIGHT, C_GREEN),
        ("右下象限", "階級 × 共識", "【德國、日本】\n• 決策機制：根回與稟議制\n• 領導者角色：整合協調者 \n• 關鍵動作：大會前私下一對一對齊，由下而上會簽審核。\n• 致命地雷：在正式會議強行舉手或當眾表態。", C_BLUE_LIGHT, C_BLUE),
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

    add_notes(s13, "這張圖是整個工作坊最核心的知識圖譜，建議請學員拍照或存檔。")

    # =========================================================================
    # SLIDE 14: 核心辨析：大 D vs. 小 d
    # =========================================================================
    s14 = prs.slides.add_slide(blank_layout)
    set_bg(s14, C_SLATE_LIGHT)
    add_header(s14, "核心哲學碰撞：「大承諾」與「小速決」的本質差異", "決策哲學辨析")

    card_w = Inches(5.65)
    card_h = Inches(4.2)
    cd1 = add_card(s14, Inches(0.8), Inches(1.5), card_w, card_h, bg_color=C_WHITE, border_color=C_INDIGO)
    cd2 = add_card(s14, Inches(6.88), Inches(1.5), card_w, card_h, bg_color=C_WHITE, border_color=C_GREEN)

    tf1 = cd1.text_frame
    tf1.word_wrap = True
    tf1.margin_left = tf1.margin_top = tf1.margin_right = Inches(0.3)
    p = tf1.paragraphs[0]
    p.text = "🏛️ 大承諾：刻在石碑上的神聖承諾"
    p.font.size = Pt(16)
    p.font.bold = True
    p.font.color.rgb = C_INDIGO
    p_sub = tf1.add_paragraph()
    p_sub.text = "決策即為終局承諾（日本、德國、荷蘭、北歐各國）\n"
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

    tf2 = cd2.text_frame
    tf2.word_wrap = True
    tf2.margin_left = tf2.margin_top = tf2.margin_right = Inches(0.3)
    p = tf2.paragraphs[0]
    p.text = "🚀 小速決：動態迭代的敏捷里程碑"
    p.font.size = Pt(16)
    p.font.bold = True
    p.font.color.rgb = C_GREEN
    p_sub2 = tf2.add_paragraph()
    p_sub2.text = "決策即為動態里程碑（新創與敏捷團隊）\n"
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

    sol_card = add_card(s14, Inches(0.8), Inches(5.95), Inches(11.733), Inches(1.05), bg_color=C_NAVY, border_color=None)
    stf = sol_card.text_frame
    stf.word_wrap = True
    stf.margin_left = stf.margin_top = stf.margin_right = Inches(0.3)
    sp = stf.paragraphs[0]
    sp.text = "💡 跨國合作解方：導入雙軌宣告協定"
    sp.font.size = Pt(13)
    sp.font.bold = True
    sp.font.color.rgb = C_AMBER
    sp2 = stf.add_paragraph()
    sp2.text = "跨國管理最大的災難是用同一個詞彙『決策』，雙方卻懷抱完全不同的心理預期！會議結束前，主持人必須明確宣告：這是不可輕易翻案的「大承諾」，還是隨時可調的「小速決」？"
    sp2.font.size = Pt(11)
    sp2.font.color.rgb = C_WHITE

    add_notes(s14, "跨國管理最大的災難是用同一個詞彙卻懷抱完全不同的心理預期。")

    # =========================================================================
    # SLIDE 15: HBR Linda Hill 領導三大要務
    # =========================================================================
    s15 = prs.slides.add_slide(blank_layout)
    set_bg(s15, C_SLATE_LIGHT)
    add_header(s15, "哈佛商業評論 領導三大要務自我檢核", "領導三大要務")

    imp_w = Inches(11.733)
    imp_h = Inches(1.6)
    imperatives = [
        ("要務一：管理自己 · 放下文化優越感", "從「用自己的文化尺規衡量他人」走向「因地制宜切換座標」。認知到文化風格沒有高下之分；領導者的權威不是來自職級或強推個人習慣，而是來自對在地脈絡的精準同理與適應力。", C_AMBER_LIGHT, C_AMBER),
        ("要務二：管理網絡 · 建立跨邊界同盟", "辨識跨國組織內部的「非正式權力地圖」。在階層制文化中尊重垂直網絡與長幼序位；在平等文化中建立橫向網絡。善用會前「會前私下摸底（根回）」，將潛在抗拒者轉化為協作盟友。", C_BLUE_LIGHT, C_BLUE),
        ("要務三：打造團隊 · 建立多元心理安全感", "建立容許不同發言風格的團隊文化常規（團隊合作常規）。為習慣沉默的成員打造非正式一對一表達管道，為敏捷直率的成員規範決策界限，將文化衝突轉化為跨國創新的核心競爭力。", C_GREEN_LIGHT, C_GREEN),
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

    add_notes(s15, "管理自己是基礎，管理網絡是槓桿，打造團隊是成果。")

    # =========================================================================
    # SLIDE 16: 結語與頒獎
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

    add_notes(s16, "請講師統計各組總分，邀請冠軍組別起立接受全場鼓掌，頒發象徵性的文化王榮譽！")

    output_path = "/Users/routertt/Documents/OB/GPT/誰是文化王_備案簡報_Who_Is_Culture_King.pptx"
    prs.save(output_path)
    print(f"Successfully generated presentation at: {output_path}")
    os.system(f"cp '{output_path}' '/Users/routertt/Documents/OB/誰是文化王_備案簡報_Who_Is_Culture_King.pptx'")
    print("Copied to workspace root!")

if __name__ == '__main__':
    build_presentation()
