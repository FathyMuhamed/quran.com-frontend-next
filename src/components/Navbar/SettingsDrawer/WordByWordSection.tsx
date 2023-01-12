/* eslint-disable i18next/no-literal-string */
/* eslint-disable max-lines */
import React from 'react';

import { Action } from '@reduxjs/toolkit';
import Trans from 'next-translate/Trans';
import useTranslation from 'next-translate/useTranslation';
import { useRouter } from 'next/router';
import { shallowEqual, useSelector } from 'react-redux';

import Section from './Section';
import styles from './WordByWordSection.module.scss';

import Checkbox from '@/dls/Forms/Checkbox/Checkbox';
import Select, { SelectSize } from '@/dls/Forms/Select';
import Link, { LinkVariant } from '@/dls/Link/Link';
import Separator from '@/dls/Separator/Separator';
import usePersistPreferenceGroup from '@/hooks/auth/usePersistPreferenceGroup';
import {
  setSelectedWordByWordLocale,
  selectReadingPreferences,
  setWordByWordDisplay,
  setWordByWordContentType,
  setWordClickFunctionality,
} from '@/redux/slices/QuranReader/readingPreferences';
import QueryParam from '@/types/QueryParam';
import { WordByWordDisplay, WordByWordType, WordClickFunctionality } from '@/types/QuranReader';
import { removeItemFromArray } from '@/utils/array';
import { logValueChange } from '@/utils/eventLogger';
import { getLocaleName } from '@/utils/locale';
import PreferenceGroup from 'types/auth/PreferenceGroup';

export const WBW_LOCALES = ['en', 'ur', 'id', 'bn', 'tr', 'fa', 'ru', 'hi', 'de', 'ta', 'inh'];
export const WORD_BY_WORD_LOCALES_OPTIONS = WBW_LOCALES.map((locale) => ({
  label: getLocaleName(locale),
  value: locale,
}));

const WordByWordSection = () => {
  const { t, lang } = useTranslation('common');
  const {
    actions: { onSettingsChange },
    isLoading,
  } = usePersistPreferenceGroup();
  const router = useRouter();

  const readingPreferences = useSelector(selectReadingPreferences, shallowEqual);
  const {
    selectedWordByWordLocale: wordByWordLocale,
    wordByWordDisplay,
    wordByWordContentType,
    wordClickFunctionality,
  } = readingPreferences;
  /**
   * Persist settings in the DB if the user is logged in before dispatching
   * Redux action, otherwise just dispatch it.
   *
   * @param {string} key
   * @param {string | number|boolean} value
   * @param {Action} action
   */
  const onWordByWordSettingsChange = (
    key: string,
    value: string | number | boolean | string[],
    action: Action,
    undoAction: Action,
  ) => {
    onSettingsChange(key, value, action, undoAction, PreferenceGroup.READING);
  };

  const onWordByWordLocaleChange = (value: string) => {
    logValueChange('wbw_locale', wordByWordLocale, value);
    router.query[QueryParam.WBW_LOCALE] = value;
    router.push(router, undefined, { shallow: true });
    onWordByWordSettingsChange(
      'selectedWordByWordLocale',
      value,
      setSelectedWordByWordLocale({ value, locale: lang }),
      setSelectedWordByWordLocale({ value: wordByWordLocale, locale: lang }),
    );
  };

  const onRecitationChange = (isChecked: boolean) => {
    const newValue = isChecked ? WordClickFunctionality.PlayAudio : WordClickFunctionality.NoAudio;
    const oldValue =
      newValue === WordClickFunctionality.PlayAudio
        ? WordClickFunctionality.NoAudio
        : WordClickFunctionality.PlayAudio;
    logValueChange('audio_settings_word_click_functionality', oldValue, newValue);
    onWordByWordSettingsChange(
      'wordClickFunctionality',
      newValue,
      setWordClickFunctionality(newValue),
      setWordClickFunctionality(oldValue),
    );
  };

  const onDisplaySettingChange = (isInlineCheckbox: boolean, isChecked: boolean) => {
    const type = isInlineCheckbox ? WordByWordDisplay.INLINE : WordByWordDisplay.TOOLTIP;
    const nextWordByWordDisplay = isChecked
      ? [...wordByWordDisplay, type]
      : removeItemFromArray(type, wordByWordDisplay);
    logValueChange('wbw_display', wordByWordDisplay, nextWordByWordDisplay);
    onWordByWordSettingsChange(
      'wordByWordDisplay',
      nextWordByWordDisplay,
      setWordByWordDisplay(nextWordByWordDisplay),
      setWordByWordDisplay(wordByWordDisplay),
    );
  };

  const onContentTypeChange = (isTranslationCheckbox: boolean, isChecked: boolean) => {
    const type = isTranslationCheckbox
      ? WordByWordType.Translation
      : WordByWordType.Transliteration;
    const nextWordByWordContentType = isChecked
      ? [...wordByWordContentType, type]
      : removeItemFromArray(type, wordByWordContentType);
    logValueChange('wbw_content_type', wordByWordContentType, nextWordByWordContentType);
    onWordByWordSettingsChange(
      'wordByWordContentType',
      nextWordByWordContentType,
      setWordByWordContentType(nextWordByWordContentType),
      setWordByWordContentType(wordByWordContentType),
    );
  };

  const shouldDisableWordByWordDisplay = !wordByWordContentType || !wordByWordContentType.length;

  return (
    <Section>
      <Section.Title isLoading={isLoading}>{t('wbw')}</Section.Title>
      <Section.Row>
        <div className={styles.checkboxContainer}>
          <Checkbox
            checked={wordByWordContentType.includes(WordByWordType.Translation)}
            id="wbw-translation"
            name="wbw-translation"
            label={t('translation')}
            onChange={(isChecked) => onContentTypeChange(true, isChecked)}
          />
          <Checkbox
            checked={wordByWordContentType.includes(WordByWordType.Transliteration)}
            id="wbw-transliteration"
            name="wbw-transliteration"
            label={t('transliteration')}
            onChange={(isChecked) => onContentTypeChange(false, isChecked)}
          />
          <Checkbox
            checked={wordClickFunctionality === WordClickFunctionality.PlayAudio}
            id="wbw-recitation"
            name="wbw-recitation"
            label={t('recitation')}
            onChange={onRecitationChange}
          />
          <div className={styles.summaryText}>
            <Trans
              components={{ span: <span className={styles.source} /> }}
              i18nKey="common:reciter-summary"
              values={{ reciterName: 'Shaikh Wisam Sharieff' }}
            />
          </div>
        </div>
      </Section.Row>
      <Separator className={styles.separator} />
      <Section.Row>
        <Section.Label>{t('language')}</Section.Label>
        <Select
          size={SelectSize.Small}
          id="wordByWord"
          name="wordByWord"
          options={WORD_BY_WORD_LOCALES_OPTIONS}
          value={wordByWordLocale}
          onChange={onWordByWordLocaleChange}
        />
      </Section.Row>
      <div className={styles.summaryText}>
        <Trans
          components={{
            link: <Link isNewTab href="https://quranwbw.com/" variant={LinkVariant.Blend} />,
          }}
          i18nKey="common:wbw-lang-summary"
          values={{ source: 'quranwbw' }}
        />
      </div>
      <p>{t('display')}</p>
      <Section.Row>
        <div className={styles.displayContainer}>
          <div>
            <Checkbox
              checked={wordByWordDisplay.includes(WordByWordDisplay.INLINE)}
              id="inline"
              name="inline"
              label={t('inline')}
              disabled={shouldDisableWordByWordDisplay}
              onChange={(isChecked) => onDisplaySettingChange(true, isChecked)}
            />
          </div>
          <div>
            <Checkbox
              checked={wordByWordDisplay.includes(WordByWordDisplay.TOOLTIP)}
              id="tooltip"
              name="word-tooltip"
              label={t('tooltip')}
              disabled={shouldDisableWordByWordDisplay}
              onChange={(isChecked) => onDisplaySettingChange(false, isChecked)}
            />
          </div>
        </div>
      </Section.Row>
    </Section>
  );
};

export default WordByWordSection;
