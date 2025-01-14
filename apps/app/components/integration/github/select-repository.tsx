import React from "react";

import { useRouter } from "next/router";

import useSWRInfinite from "swr/infinite";

// services
import projectService from "services/project.service";
// ui
import { CustomSearchSelect } from "components/ui";
// helpers
import { truncateText } from "helpers/string.helper";
// types
import { IWorkspaceIntegration } from "types";

type Props = {
  integration: IWorkspaceIntegration;
  value: any;
  label: string;
  onChange: (repo: any) => void;
  characterLimit?: number;
};

export const SelectRepository: React.FC<Props> = ({
  integration,
  value,
  label,
  onChange,
  characterLimit = 25,
}) => {
  const router = useRouter();
  const { workspaceSlug } = router.query;

  const getKey = (pageIndex: number) => {
    if (!workspaceSlug || !integration) return;

    return `${
      process.env.NEXT_PUBLIC_API_BASE_URL
    }/api/workspaces/${workspaceSlug}/workspace-integrations/${
      integration.id
    }/github-repositories/?page=${++pageIndex}`;
  };

  const fetchGithubRepos = async (url: string) => {
    const data = await projectService.getGithubRepositories(url);

    return data;
  };

  const {
    data: paginatedData,
    size,
    setSize,
    isValidating,
  } = useSWRInfinite(getKey, fetchGithubRepos);

  const userRepositories = (paginatedData ?? []).map((data) => data.repositories).flat();
  const totalCount = paginatedData && paginatedData.length > 0 ? paginatedData[0].total_count : 0;

  const options =
    userRepositories.map((repo) => ({
      value: repo.id,
      query: repo.full_name,
      content: <p>{truncateText(repo.full_name, characterLimit)}</p>,
    })) ?? [];

  return (
    <CustomSearchSelect
      value={value}
      options={options}
      onChange={(val: string) => {
        const repo = userRepositories.find((repo) => repo.id === val);

        onChange(repo);
      }}
      label={label}
      footerOption={
        <>
          {userRepositories && options.length < totalCount && (
            <button
              type="button"
              className="w-full p-1 text-center text-[0.6rem] text-gray-500 hover:bg-hover-gray"
              onClick={() => setSize(size + 1)}
              disabled={isValidating}
            >
              {isValidating ? "Loading..." : "Click to load more..."}
            </button>
          )}
        </>
      }
      position="right"
      optionsClassName="w-full"
    />
  );
};
