import { TextareaAutosize } from '@material-ui/core';
import classNames from 'classnames';
import React, { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { useDispatch, useSelector } from 'react-redux';
import { createTheme, deleteTheme, getTheme, updateTheme } from '../../../store/themes';
import { openSaveChanges } from '../../../store/ui';
import { updateSelf } from '../../../store/users';
import Input from '../../inputs/input';
import SidebarIcon from '../../navigation/sidebar/sidebar-icon';
import CircleButton from '../../utils/buttons/circle-button';
import NormalButton from '../../utils/buttons/normal-button';
import SaveChanges from '../../utils/save-changes';

const UserSettingsThemes: React.FunctionComponent = () => {
  const dispatch = useDispatch();
  const themes = useSelector((s: Store.AppState) => s.entities.themes);
  const user = useSelector((s: Store.AppState) => s.auth.user);
  const [themeId, setTab] = useState(user.activeThemeId);
  
  useEffect(() => {
    const theme = getTheme(themeId, themes);
    if (!theme) setTab('default');
  }, [themeId]);

  const SideIcons: React.FunctionComponent = () => (
    <div className="flex items-center flex-col">
      {themes.map(t => (
        <div
          key={t.id}
          className="w-12"
          onClick={() => setTab(t.id)}
          title={t.name}>
          <SidebarIcon
            childClasses={classNames('bg-bg-secondary', {
              'border-2 border-primary h-[3.1rem]': t.id === themeId,
            })}
            imageURL={t.iconURL}
            name={t.name}
            disableHoverEffect />
        </div>
      ))}
      <CircleButton
        className="m-2"
        onClick={() => dispatch(createTheme('New Theme'))}
        style={{ color: 'var(--success)' }}>+</CircleButton>
    </div>
  );

  const ThemeDetails: React.FunctionComponent = () => {
    const { register, setValue, handleSubmit } = useForm();
    const theme = themes.find(t => t.id === themeId);
    if (!theme) return null;
  
    const onApply = () => dispatch(updateSelf({ activeThemeId: themeId }));
    const onDelete = () => {
      const confirmation = window.confirm('Are you sure you want to delete this theme?');
      if (confirmation) dispatch(deleteTheme(theme.id));
    };
    const onSave = (e) => {      
      const onUpdate = (payload) => dispatch(updateTheme(themeId, payload));
      handleSubmit(onUpdate)(e);
    };
    
    return (themeId) ? (
      <div className="px-5 ml-4">
        <form
          onChange={() => dispatch(openSaveChanges(true))}
          className="flex flex-col h-full mt-1 mb-5">
          <header className="mb-5">
            <h1 className="text-xl font-bold inline">{theme.name}</h1>
          </header>

          <div className="flex">
            <Input
              className="w-1/3 mr-5"
              label="Name"
              name="name"
              register={register}
              options={{ value: theme.name }} />
            <Input
              tooltip="The code that is used to share themes."
              className="w-1/3"
              label="Code"
              name="code"
              register={register}
              options={{ value: theme.code }} />
          </div>

          <textarea
            className="p-2 rounded bg-bg-secondary outline-none border-bg-tertiary hover:border w-1/2 mt-2"
            defaultValue={theme.styles}
            {...register('styles', { value: theme.styles })} />

          <SaveChanges
            setValue={setValue}
            onSave={onSave}
            obj={theme} />
        </form>

        <NormalButton
          className="bg-success dark mt-5"
          onClick={onApply}>Apply</NormalButton>
        <NormalButton
          className="bg-danger dark mt-5 ml-2"
          onClick={onDelete}>Delete</NormalButton>
      </div>
    ) : null;
  }

  return (
    <div className="grid grid-cols-12 flex-col pt-14 px-10 pb-20 h-full mt-1 gap-6">
      <div className="col-span-1"><SideIcons /></div>
      <div className="col-span-11"><ThemeDetails /></div>
    </div>
  );
}
 
export default UserSettingsThemes;