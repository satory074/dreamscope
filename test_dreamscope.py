#!/usr/bin/env python3
"""
DreamScope Application Testing Script using Playwright
"""

from playwright.sync_api import sync_playwright
import time
from datetime import datetime
import os

def test_dreamscope():
    """Test DreamScope application functionality"""
    
    # Create screenshots directory
    screenshot_dir = "test_screenshots"
    os.makedirs(screenshot_dir, exist_ok=True)
    
    with sync_playwright() as p:
        # Launch browser
        browser = p.chromium.launch(headless=False)
        context = browser.new_context()
        page = context.new_page()
        
        print("1. Testing application display...")
        # Navigate to the application
        page.goto("http://localhost:8001")
        page.wait_for_load_state("networkidle")
        
        # Take initial screenshot
        page.screenshot(path=f"{screenshot_dir}/01_initial_view.png", full_page=True)
        print("✓ Application loaded successfully")
        
        print("\n2. Testing navigation buttons...")
        # Check if navigation buttons exist
        record_button = page.locator('button:has-text("記録")')
        history_button = page.locator('button:has-text("履歴")')
        analysis_button = page.locator('button:has-text("分析")')
        
        # Click record button
        record_button.click()
        time.sleep(1)
        page.screenshot(path=f"{screenshot_dir}/02_record_view.png", full_page=True)
        print("✓ Record button works")
        
        # Click history button
        history_button.click()
        time.sleep(1)
        page.screenshot(path=f"{screenshot_dir}/03_history_view.png", full_page=True)
        print("✓ History button works")
        
        # Click analysis button
        analysis_button.click()
        time.sleep(1)
        page.screenshot(path=f"{screenshot_dir}/04_analysis_view.png", full_page=True)
        print("✓ Analysis button works")
        
        print("\n3. Testing dream recording function...")
        # Go back to record view
        record_button.click()
        time.sleep(1)
        
        # Find the textarea and input dream content
        dream_textarea = page.locator('textarea#dream-input')
        test_dream_content = f"テストの夢 - {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}\n空を飛ぶ夢を見ました。青い空に白い雲が浮かんでいて、とても気持ちよかったです。"
        
        dream_textarea.fill(test_dream_content)
        page.screenshot(path=f"{screenshot_dir}/05_dream_input.png", full_page=True)
        
        # Click save button
        save_button = page.locator('button:has-text("記録する")')
        save_button.click()
        time.sleep(2)
        
        # Check if alert or confirmation appears
        page.screenshot(path=f"{screenshot_dir}/06_after_save.png", full_page=True)
        print("✓ Dream recording completed")
        
        print("\n4. Testing history display...")
        # Navigate to history
        history_button.click()
        time.sleep(2)
        
        # Check if the dream appears in history
        page.screenshot(path=f"{screenshot_dir}/07_history_with_dream.png", full_page=True)
        
        # Look for dream entries
        dream_entries = page.locator('.dream-item, .dream-entry, [class*="dream"]')
        entry_count = dream_entries.count()
        print(f"✓ Found {entry_count} dream entries in history")
        
        print("\n5. Testing AI analysis function...")
        # Try to find and click on a dream entry for analysis
        if entry_count > 0:
            # Click on the first dream entry
            dream_entries.first.click()
            time.sleep(1)
            page.screenshot(path=f"{screenshot_dir}/08_dream_selected.png", full_page=True)
            
            # Look for analyze button
            analyze_buttons = page.locator('button:has-text("分析"), button:has-text("AI分析"), button:has-text("analyze")')
            if analyze_buttons.count() > 0:
                analyze_buttons.first.click()
                time.sleep(3)  # Wait for AI analysis
                page.screenshot(path=f"{screenshot_dir}/09_ai_analysis_result.png", full_page=True)
                print("✓ AI analysis executed")
            else:
                print("⚠ AI analysis button not found")
        else:
            print("⚠ No dreams found to analyze")
        
        # Take final screenshot
        page.screenshot(path=f"{screenshot_dir}/10_final_state.png", full_page=True)
        
        # Close browser
        browser.close()
        
        print(f"\n✅ Testing completed! Screenshots saved in {screenshot_dir}/")

if __name__ == "__main__":
    test_dreamscope()